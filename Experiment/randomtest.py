import tensorflow as tf
from transformers import RobertaTokenizer
import os

saved_model_path = './fine_tuned_roberta_model'
model = tf.saved_model.load(saved_model_path)
tokenizer = RobertaTokenizer.from_pretrained("roberta-base")

def make_prediction(text):
    inputs = tokenizer(text, return_tensors="tf", truncation=True, padding=True, max_length=512)
    inputs['token_type_ids'] = tf.zeros_like(inputs['input_ids'])

    inference_fn = model.signatures["serving_default"]
    predictions = inference_fn(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'], token_type_ids=inputs['token_type_ids'])

    logits = predictions['logits']

    predicted_class = tf.argmax(logits, axis=-1).numpy()[0]

    if predicted_class == 1:
        return "REAL"
    else:
        return "FAKE"

if __name__ == "__main__":
    while True:
        review = input("\nEnter a review text (or 'exit' to quit): ")
        if review.lower() == 'exit':
            print("Exiting...")
            break

        prediction = make_prediction(review)
        print(f"Prediction: {prediction}")
