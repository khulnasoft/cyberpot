FROM alpine:3.22
ARG CYBERPOT_VERSION=24.04.2
LABEL org.opencontainers.image.title="dot-init" \
      org.opencontainers.image.description="CyberPot dynamic init via dotfiles (XDG, stow, chezmoi)" \
      org.opencontainers.image.version="$CYBERPOT_VERSION" \
      org.opencontainers.image.source="https://github.com/khulnasoft/cyberpot"

# Include dist with link for better cache
COPY --link dist/ /opt/cyberpot/

# Install packages with cache mount, include dotfiles tools
RUN --mount=type=cache,target=/var/cache/apk \
    apk --no-cache add \
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
        stow \
        chezmoi \
        tar \
        uuidgen \
        yq-go && \
    addgroup -g 2000 cyberpot && \
    adduser -S -s /bin/ash -u 2000 -D -g 2000 cyberpot && \
    chmod 0600 /opt/cyberpot/etc/logrotate/logrotate.conf && \
    # Setup dotfiles XDG dirs
    mkdir -p /home/cyberpot/.cyberpot /home/cyberpot/.config/cyberpot /home/cyberpot/.local/share/cyberpot && \
    chown -R cyberpot:cyberpot /home/cyberpot && \
    rm -rf /root/.cache /var/cache/apk/*

WORKDIR /opt/cyberpot
# Canonical healthcheck with timeout and start-period
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 CMD test -f /tmp/success || exit 1
STOPSIGNAL SIGTERM
ENTRYPOINT ["/opt/cyberpot/entrypoint.sh"]
