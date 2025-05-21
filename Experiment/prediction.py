from flask import Flask, request, jsonify
from flask_cors import CORS 
import tensorflow as tf
from transformers import RobertaTokenizer
import os

app = Flask(__name__)
CORS(app) 

saved_model_path = './fine_tuned_roberta_model'
model = tf.saved_model.load(saved_model_path)
tokenizer = RobertaTokenizer.from_pretrained("roberta-base")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    text = data.get('text', '')  

    if not text:
        return jsonify({"error": "No text provided"}), 400

    print(f"Received Review Text: {text}")  

    inputs = tokenizer(text, return_tensors="tf", truncation=True, padding=True, max_length=512)

    inputs['token_type_ids'] = tf.zeros_like(inputs['input_ids'])

    inference_fn = model.signatures["serving_default"]
    predictions = inference_fn(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'], token_type_ids=inputs['token_type_ids'])

    logits = predictions['logits']

    predicted_class = tf.argmax(logits, axis=-1).numpy()[0]

    if predicted_class == 1:
        return jsonify({"prediction": "REAL"})
    else:
        return jsonify({"prediction": "FAKE"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
