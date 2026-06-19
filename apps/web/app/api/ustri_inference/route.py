# apps/web/app/api/ustri_inference/route.py
import os
import json
import base64
import sys
from PIL import Image
from io import BytesIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'USTri'))
from us_tri_agent import USTriAgent

ustri_agent = USTriAgent()

def handler(request):
    """
    Vercel Serverless Function для выполнения инференса с USTriAgent.
    Принимает base64-кодированное изображение и возвращает результаты инференса.
    """
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'headers': { 'Content-Type': 'application/json' },
            'body': json.dumps({ 'error': 'Method Not Allowed' })
        }

    try:
        body = json.loads(request.body)
        image_data_base64 = body.get('image')
        task_id = body.get('task_id', 'default_task')

        if not image_data_base64:
            return {
                'statusCode': 400,
                'headers': { 'Content-Type': 'application/json' },
                'body': json.dumps({ 'error': 'Missing image data' })
            }

        image_bytes = base64.b64decode(image_data_base64)
        image = Image.open(BytesIO(image_bytes))

        results = ustri_agent.predict(image, task_id)

        return {
            'statusCode': 200,
            'headers': { 'Content-Type': 'application/json' },
            'body': json.dumps(results)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': { 'Content-Type': 'application/json' },
            'body': json.dumps({ 'error': str(e) })
        }