
import os
import torch
import numpy as np
import cv2
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2
from typing import Dict, Any, List, Tuple, Optional

# Assuming USTri modules are available in the path or installed
from USTri.model_factory import MultiTaskModelFactory, TASK_CONFIGURATIONS
from USTri.model import IMAGENET_MEAN, IMAGENET_STD

class USTriAgent:
    def __init__(
        self,
        ustri_model_path: str,
        encoder_name: str = 'R50-ViT-B_16',
        regression_heatmap_size: int = 64,
        per_dataset_decoders: bool = True,
        use_task_adapters: bool = True,
        adapter_reduction: int = 4,
    ):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.ustri_model_path = ustri_model_path
        self.encoder_name = encoder_name
        self.regression_heatmap_size = regression_heatmap_size
        self.per_dataset_decoders = per_dataset_decoders
        self.use_task_adapters = use_task_adapters
        self.adapter_reduction = adapter_reduction

        self.model = self._load_model()
        self.model.eval()

        self.transforms = A.Compose([
            A.Resize(256, 256),
            A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ToTensorV2(),
        ])

        self.task_id_to_name = {cfg['task_id']: cfg['task_name'] for cfg in TASK_CONFIGURATIONS}

    def _load_model(self) -> MultiTaskModelFactory:
        print(f"Loading USTri model from {self.ustri_model_path}...")
        model = MultiTaskModelFactory(
            encoder_name=self.encoder_name,
            encoder_weights=None, # Weights are loaded with checkpoint
            task_configs=TASK_CONFIGURATIONS,
            regression_heatmap_size=self.regression_heatmap_size,
            per_dataset_decoders=self.per_dataset_decoders,
            use_task_adapters=self.use_task_adapters,
            adapter_reduction=self.adapter_reduction,
        ).to(self.device)

        if not os.path.exists(self.ustri_model_path):
            raise FileNotFoundError(f"USTri model checkpoint not found: {self.ustri_model_path}")
        
        checkpoint = torch.load(self.ustri_model_path, map_location=self.device)
        model.load_state_dict(checkpoint)
        print("USTri model loaded successfully!")
        return model

    def _preprocess_image(self, image: Image.Image) -> torch.Tensor:
        image_np = np.array(image.convert("RGB"))
        augmented = self.transforms(image=image_np)
        return augmented['image'].unsqueeze(0) # Add batch dimension

    def predict(self, image: Image.Image, task_id: str) -> Dict[str, Any]:
        if task_id not in self.task_id_to_name:
            raise ValueError(f"Unsupported task_id: {task_id}. Available tasks: {list(self.task_id_to_name.keys())}")

        task_name = self.task_id_to_name[task_id]
        input_tensor = self._preprocess_image(image)

        with torch.no_grad():
            output = self.model(input_tensor, task_id=task_id)

        if task_name == 'classification':
            return self._process_classification_output(output, task_id)
        elif task_name == 'Regression':
            return self._process_regression_output(output, task_id, image.size)
        elif task_name == 'segmentation':
            return self._process_segmentation_output(output, task_id, image.size)
        elif task_name == 'detection':
            return self._process_detection_output(output, task_id, image.size)
        else:
            return {"task_id": task_id, "task_name": task_name, "raw_output": output.cpu().numpy().tolist()}

    def _process_classification_output(self, output: torch.Tensor, task_id: str) -> Dict[str, Any]:
        probabilities = torch.softmax(output, dim=1).cpu().numpy()[0]
        predicted_class_idx = np.argmax(probabilities)
        # For breast classification, map to BI-RADS. This would need specific mapping logic
        # for each task_id. For now, just return index and probabilities.
        return {
            "task_id": task_id,
            "task_name": "classification",
            "predicted_class_index": int(predicted_class_idx),
            "probabilities": probabilities.tolist(),
            "bi_rads": self._map_to_bi_rads(task_id, predicted_class_idx)
        }

    def _process_regression_output(self, output: torch.Tensor, task_id: str, original_size: Tuple[int, int]) -> Dict[str, Any]:
        # Assuming output is normalized coordinates (e.g., from extract_coordinates in USTri/utils.py)
        # We need the actual extract_coordinates function or similar logic here.
        # For now, let's assume it's flat normalized coordinates: [x1, y1, x2, y2, ...]
        h, w = original_size[1], original_size[0] # PIL Image.size is (width, height)
        coords_norm = output.cpu().numpy()[0].flatten().tolist()
        pixel_coords = []
        for i in range(0, len(coords_norm), 2):
            x_norm, y_norm = coords_norm[i], coords_norm[i+1]
            x_pixel = x_norm * w
            y_pixel = y_norm * h
            pixel_coords.extend([x_pixel, y_pixel])

        return {
            "task_id": task_id,
            "task_name": "Regression",
            "predicted_points_normalized": coords_norm,
            "predicted_points_pixels": pixel_coords,
        }
    
    def _process_segmentation_output(self, output: torch.Tensor, task_id: str, original_size: Tuple[int, int]) -> Dict[str, Any]:
        # Output is (C, H, W) or (H, W). For multi-class, take argmax.
        mask_np = output.cpu().numpy()[0]
        if mask_np.ndim == 3:
            mask_np = np.argmax(mask_np, axis=0).astype(np.uint8)
        else:
            mask_np = mask_np.astype(np.uint8)

        h, w = original_size[1], original_size[0]
        mask_resized = cv2.resize(mask_np, (w, h), interpolation=cv2.INTER_NEAREST)
        
        # Convert to a base64 encoded image string or save to temp file
        # For now, let's just return a placeholder for the mask
        return {
            "task_id": task_id,
            "task_name": "segmentation",
            "mask_available": True, # Indicates a mask was generated
            "mask_shape": mask_resized.shape # Actual mask data would be stored/returned differently
        }
    
    def _process_detection_output(self, output: torch.Tensor, task_id: str, original_size: Tuple[int, int]) -> Dict[str, Any]:
        # Assuming output is normalized bbox [x1, y1, x2, y2]
        bbox_norm = output.cpu().numpy()[0].flatten().tolist()
        h, w = original_size[1], original_size[0]
        bbox_pixel = [
            bbox_norm[0] * w,
            bbox_norm[1] * h,
            bbox_norm[2] * w,
            bbox_norm[3] * h,
        ]
        return {
            "task_id": task_id,
            "task_name": "detection",
            "bbox_normalized": bbox_norm,
            "bbox_pixels": bbox_pixel,
        }

    def _map_to_bi_rads(self, task_id: str, class_index: int) -> Optional[str]:
        if task_id == 'breast_2cls': # Example: malignant/benign
            return {0: "BI-RADS 2 (Benign)", 1: "BI-RADS 4/5 (Suspicious/Malignant)"}.get(class_index)
        if task_id == 'breast_3cls': # Example: benign/intermediate/malignant
            return {0: "BI-RADS 2 (Benign)", 1: "BI-RADS 3 (Probably Benign)", 2: "BI-RADS 4/5 (Suspicious/Malignant)"}.get(class_index)
        # Add more specific BI-RADS mappings as needed for other task_ids
        return None

if __name__ == '__main__':
    # This is a placeholder for actual model weights. 
    # You would need to download a pre-trained USTri model checkpoint.
    # For demonstration, we'll use a dummy path.
    USTRI_MODEL_PATH = "USTri/USpec.pth" 

    # Example Usage:
    # Create a dummy image
    dummy_image = Image.new('RGB', (512, 512), color = 'red')

    try:
        # Instantiate the agent
        ustri_agent = USTriAgent(ustri_model_path=USTRI_MODEL_PATH)
        
        # Example: Breast 3-class classification
        print("\n--- Testing breast_3cls classification ---")
        result_breast_cls = ustri_agent.predict(dummy_image, 'breast_3cls')
        print(result_breast_cls)

        # Example: Fetal plane classification
        print("\n--- Testing fetal_plane_cls classification ---")
        result_fetal_plane_cls = ustri_agent.predict(dummy_image, 'fetal_plane_cls')
        print(result_fetal_plane_cls)

        # Example: Fetal femur regression (keypoint detection)
        print("\n--- Testing fetal_femur regression ---")
        result_fetal_femur_reg = ustri_agent.predict(dummy_image, 'fetal_femur')
        print(result_fetal_femur_reg)

        # Example: Segmentation (e.g., cardiac_multi)
        print("\n--- Testing cardiac_multi segmentation ---")
        result_segmentation = ustri_agent.predict(dummy_image, 'cardiac_multi')
        print(result_segmentation)

    except FileNotFoundError as e:
        print(f"Error: {e}. Please provide a valid path to a USTri model checkpoint.")
    except ValueError as e:
        print(f"Error: {e}.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
