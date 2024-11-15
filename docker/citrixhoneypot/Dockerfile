# Base Image
FROM alpine:3.19

# Set Environment Variables
ENV APP_DIR="/opt/citrixhoneypot" \
    SSL_DIR="/opt/citrixhoneypot/ssl" \
    LOG_DIR="/opt/citrixhoneypot/logs" \
    PYTHON_LOGGER_VERSION="2.0.4"

# Install required packages and Python dependencies
RUN apk --no-cache add --update \
        git \
        libcap \
        openssl \
        py3-pip \
        python3 && \
    pip3 install --no-cache-dir python-json-logger=="${PYTHON_LOGGER_VERSION}" && \
    \
# Clone CitrixHoneypot repository
    git clone --depth=1 https://github.com/Cyb3rhq/CitrixHoneypot "${APP_DIR}" && \
    \
# Set up directories, SSL certificates, and permissions
    mkdir -p "${LOG_DIR}" "${SSL_DIR}" && \
    openssl req \
        -nodes \
        -x509 \
        -newkey rsa:2048 \
        -keyout "${SSL_DIR}/key.pem" \
        -out "${SSL_DIR}/cert.pem" \
        -days 365 \
        -subj '/C=AU/ST=Some-State/O=Internet Widgits Pty Ltd' && \
    addgroup -g 2000 citrixhoneypot && \
    adduser -S -H -s /bin/ash -u 2000 -D -g 2000 citrixhoneypot && \
    chown -R citrixhoneypot:citrixhoneypot "${APP_DIR}" && \
    setcap cap_net_bind_service=+ep $(readlink -f $(type -P python3)) && \
    \
# Clean up unnecessary files and reduce image size
    apk del --purge git openssl && \
    rm -rf /root/* /var/cache/apk/* "${APP_DIR}/.git"

# Set working directory and runtime configuration
USER citrixhoneypot:citrixhoneypot
WORKDIR "${APP_DIR}"

# Define stop signal and default command
STOPSIGNAL SIGINT
CMD ["nohup", "/usr/bin/python3", "CitrixHoneypot.py"]
