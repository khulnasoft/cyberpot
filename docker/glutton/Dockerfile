# Stage 1: Build the Glutton binary
FROM golang:1.21-alpine AS builder

# Include dist files
COPY dist/ /root/dist/

# Install necessary build tools and libraries
RUN apk -U --no-cache add \
        make \
        git \
        g++ \
        iptables-dev \
        libpcap-dev && \
    # Setup Go and clone Glutton repo
    mkdir -p /opt/ && \
    cd /opt/ && \
    git clone https://github.com/mushorg/glutton && \
    cd /opt/glutton/ && \
    git checkout c1204c65ce32bfdc0e08fb2a9abe89b3b8eeed62 && \
    # Replace system.go with your custom version
    cp /root/dist/system.go . && \
    # Build Glutton
    make build && \
    # Move config file
    mv /root/dist/config.yaml /opt/glutton/config/

# Stage 2: Create the final image
FROM alpine:3.19

# Copy necessary files from the builder stage
COPY --from=builder /opt/glutton/bin /opt/glutton/bin
COPY --from=builder /opt/glutton/config /opt/glutton/config
COPY --from=builder /opt/glutton/rules /opt/glutton/rules

# Install runtime dependencies and libcap for setcap
RUN apk -U --no-cache add \
        iptables \
        iptables-dev \
        libpcap-dev \
        libcap && \
    # Set network capabilities for the Glutton server
    setcap cap_net_admin,cap_net_raw=+ep /opt/glutton/bin/server && \
    setcap cap_net_admin,cap_net_raw=+ep /sbin/xtables-nft-multi && \
    # Create necessary directories
    mkdir -p /var/log/glutton \
             /opt/glutton/payloads && \
    addgroup -g 2000 glutton && \
    adduser -S -s /bin/ash -u 2000 -D -g 2000 glutton && \
    chown -R glutton:glutton /opt/glutton /var/log/glutton && \
    rm -rf /var/cache/apk/* /root/*

# Set working directory
WORKDIR /opt/glutton

# Run as the Glutton user
USER glutton:glutton

# Use JSON format for CMD to ensure proper signal handling
CMD ["/opt/glutton/bin/server", "-d", "true", "-i", "$(awk '/inet.*brd/{ print $NF; exit }' /sbin/ip address show || echo 'eth0')", "-l", "/var/log/glutton/glutton.log"]
