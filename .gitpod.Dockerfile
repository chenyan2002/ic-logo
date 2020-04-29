FROM gitpod/workspace-full
                    
USER gitpod

# Install custom tools, runtime, etc. using apt-get
# For example, the command below would install "bastet" - a command line tetris clone:
#
# RUN sudo apt-get -q update && #     sudo apt-get install -yq bastet && #     sudo rm -rf /var/lib/apt/lists/*
#
# More information: https://www.gitpod.io/docs/config-docker/
RUN sudo apt-get -q update \
 && wget https://sdk.dfinity.org/install.sh -O /tmp/install-sdk.sh \
 && sh -c 'yes Y | DFX_VERSION=0.5.6 sh /tmp/install-sdk.sh'
 
