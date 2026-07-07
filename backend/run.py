import uvicorn

if __name__ == "__main__":
    # Run the FastAPI app
    # host 0.0.0.0 is useful to be accessible on the network, port 8000 is standard for FastAPI
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
