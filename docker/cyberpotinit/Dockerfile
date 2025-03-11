FROM alpine:3.20
#
# Include dist
COPY dist/ /opt/cyberpot/
#
# Install packages
RUN apk --no-cache -U upgrade && \
    apk --no-cache -U add \
        aria2 \
        apache2-utils \
        bash \
        bind-tools \
        conntrack-tools \
		cracklib \
        curl \
        ethtool \
        figlet \
        git \
        grep \
        iproute2 \
        iptables \
        jq \
        logrotate \
        lsblk \
        net-tools \
        openssl \
        pigz \
        tar \
        uuidgen \
        yq-go && \
#
# Setup user, logrotate permissions
    addgroup -g 2000 cyberpot && \
    adduser -S -s /bin/ash -u 2000 -D -g 2000 cyberpot && \
    chmod 0600 /opt/cyberpot/etc/logrotate/logrotate.conf && \
#
# Clean up
    apk del --purge git && \
    rm -rf /root/* /tmp/* \
           /root/.cache \
           /opt/cyberpot/.git \
           /var/cache/apk/*
#
# Run cyberpotinit
WORKDIR /opt/cyberpot
#HEALTHCHECK --interval=5s --timeout=30s --retries=3 CMD pgrep -f autoheal || exit 1
HEALTHCHECK --retries=1000 --interval=5s CMD test -f /tmp/success || exit 1
STOPSIGNAL SIGTERM
# Using ENTRYPOINT so we can catch SIGTERM for cleanup
ENTRYPOINT ["/opt/cyberpot/entrypoint.sh"]
