# Build Stage
FROM golang:1.21-alpine AS builder

# Set environment variables for consistency
ENV GOPATH=/opt/go
ENV APP_DIR=$GOPATH/src/github.com/nsmfoo/dicompot
ENV DIST_DIR=/root/dist

# Install required build tools
RUN apk --no-cache add \
    build-base \
    git \
    g++ && \
    mkdir -p $GOPATH

# Copy prebuilt dist files
COPY dist/ $DIST_DIR/

# Clone, build, and install dicompot
RUN git clone https://github.com/nsmfoo/dicompot.git $APP_DIR && \
    cd $APP_DIR && \
    git checkout 41331194156bbb17078bcc1594f4952ac06a731e && \
    go mod download && \
    go install -a -x ./server

# Runtime Stage
FROM alpine:3.19

# Set environment variables for runtime paths
ENV DICOM_DIR=/opt/dicompot
ENV LOG_DIR=/var/log/dicompot
ENV IMAGE_DIR=$DICOM_DIR/images

# Copy built binary and resources from the builder stage
COPY --from=builder /opt/go/bin/server $DICOM_DIR/server
COPY --from=builder /root/dist/dcm_pts/images $IMAGE_DIR

# Create dicompot user, group, and required directories
RUN addgroup -g 2000 dicompot && \
    adduser -S -s /bin/ash -u 2000 -D -G dicompot dicompot && \
    mkdir -p $LOG_DIR && \
    chown -R dicompot:dicompot $DICOM_DIR $LOG_DIR

# Set working directory and user
WORKDIR $DICOM_DIR
USER dicompot:dicompot

# Command to start dicompot
CMD ["./server", "-ip", "0.0.0.0", "-dir", "images", "-log", "/var/log/dicompot/dicompot.log"]
