# Use a lightweight Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy the rest of the application code
COPY . .

# Expose port 5000 (internal to Docker network)
EXPOSE 5000

# Run with Gunicorn (Production WSGI server)
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:5000", "app:app"]