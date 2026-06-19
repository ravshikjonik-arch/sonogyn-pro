import os
import subprocess
import json
import shutil
import tempfile
from pathlib import Path
from PIL import Image
from typing import Dict, Any, Optional, List

class FetalAgentsWrapper:
    def __init__(self, fetal_agents_root: str):
        self.fetal_agents_root = Path(fetal_agents_root).resolve()
        self.main_script = self.fetal_agents_root / "main.py"
        if not self.main_script.exists():
            raise FileNotFoundError(f"FetalAgents main.py not found at {self.main_script}")

    def predict(self, image: Image.Image, inquiry: str, pixel_size_mm: Optional[float] = None) -> Dict[str, Any]:
        temp_dir = None
        try:
            temp_dir = Path(tempfile.mkdtemp())
            case_dir = temp_dir / "case"
            case_dir.mkdir()

            # Save image to temporary directory
            image_path = case_dir / "input_image.png"
            image.save(image_path)

            # Create pixel_size.csv if provided
            if pixel_size_mm is not None:
                with open(case_dir / "pixel_size.csv", "w") as f:
                    f.write("filename,pixel size(mm)\n")
                    f.write(f"{image_path.name},{pixel_size_mm}\n")

            # Prepare environment variables (if needed by FetalAgents main.py for its internal tools)
            # This assumes that the required environment variables (like FETALAGENT_FETAL_BASE_PYTHON) 
            # are already set in the parent process or managed separately.
            env = os.environ.copy()
            env["PYTHONPATH"] = str(self.fetal_agents_root) + os.pathsep + env.get("PYTHONPATH", "")
            
            command = [
                "python3",
                str(self.main_script),
                "--inquiry", inquiry,
                "--case_dir", str(case_dir)
            ]
            print(f"Running FetalAgents command: {' '.join(command)}")
            process = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=True, # Raise CalledProcessError for non-zero exit codes
                env=env
            )
            
            # FetalAgents main.py prints the final report to stdout
            report_text = process.stdout
            print("FetalAgents raw output:\n", report_text)
            
            # Attempt to parse the report. FetalAgents usually prints a structured report.
            # This parsing might need to be refined based on actual output format.
            return {
                "status": "success",
                "inquiry": inquiry,
                "raw_report": report_text,
                # Further parsing can be added here to extract specific sections
            }

        except subprocess.CalledProcessError as e:
            print(f"FetalAgents command failed with exit code {e.returncode}")
            print(f"Stdout: {e.stdout}")
            print(f"Stderr: {e.stderr}")
            return {"status": "error", "message": f"FetalAgents execution failed: {e.stderr}"}
        except FileNotFoundError as e:
            return {"status": "error", "message": f"File not found: {e}"}
        except Exception as e:
            return {"status": "error", "message": f"An unexpected error occurred: {e}"}
        finally:
            if temp_dir and temp_dir.exists():
                shutil.rmtree(temp_dir)


if __name__ == '__main__':
    # Example Usage:
    # Assuming FetalAgents is cloned in the parent directory of python_integration
    fetal_agents_path = "FetalAgents"

    # Create a dummy image
    dummy_image = Image.new('RGB', (512, 512), color = 'blue')

    try:
        fetal_agent_wrapper = FetalAgentsWrapper(fetal_agents_root=fetal_agents_path)

        # Example: Estimate gestational age
        print("\n--- Testing FetalAgents for GA estimation ---")
        result_ga = fetal_agent_wrapper.predict(
            dummy_image,
            inquiry="Estimate gestational age of this fetal ultrasound scan image.",
            pixel_size_mm=0.20 # Example pixel size
        )
        print(json.dumps(result_ga, indent=2, ensure_ascii=False))

        # Example: Generate comprehensive caption
        print("\n--- Testing FetalAgents for caption generation ---")
        result_caption = fetal_agent_wrapper.predict(
            dummy_image,
            inquiry="Write a comprehensive caption for this fetal ultrasound scan image."
        )
        print(json.dumps(result_caption, indent=2, ensure_ascii=False))

    except FileNotFoundError as e:
        print(f"Error: {e}. Please ensure FetalAgents repository is correctly set up.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
