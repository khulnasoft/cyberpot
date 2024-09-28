FROM alpine:3.19
#
# Install packages
RUN apk -U --no-cache add \
		build-base \
		git \
		libcap \
		py3-pip \
		python3 \
		python3-dev \
		tzdata && \
#	     
# Install from GitHub and setup
    mkdir -p /opt && \
    cd /opt/ && \
    git clone https://github.com/khulnasoft-lab/cyberpot-attack-map -b 2.2.2 && \
    cd cyberpot-attack-map && \
    pip3 install --break-system-packages --upgrade pip && \
    pip3 install --break-system-packages -r requirements.txt && \
    setcap cap_net_bind_service=+ep $(readlink -f $(type -P python3)) && \
#
# Setup user, groups and configs
    addgroup -g 2000 map && \
    adduser -S -H -s /bin/ash -u 2000 -D -g 2000 map && \
    chown map:map -R /opt/cyberpot-attack-map && \
#
# Clean up
    apk del --purge build-base \
		git \
		python3-dev && \
    rm -rf /root/* /var/cache/apk/* /opt/cyberpot-attack-map/.git
#
# Start CyberPot-Attack-Map
ENV TZ=UTC
STOPSIGNAL SIGINT
USER map:map
WORKDIR /opt/cyberpot-attack-map
CMD /usr/bin/python3 $MAP_COMMAND
