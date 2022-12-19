FROM node:14

WORKDIR /backend/governance-backend

ENV HOME=/backend

ARG USER_ID=11000
ARG GROUP_ID=11000

RUN groupadd -g ${GROUP_ID} backend && \
    useradd -u ${USER_ID} -g backend -d /backend backend

RUN apt-get -y update && \
    apt-get install gosu

COPY ./docker/bin/* /usr/local/bin/
COPY . .

RUN yarn && yarn tsc && yarn typechain-web3-v1

ENTRYPOINT ["/backend/governance-backend/docker/entrypoint.sh"]

CMD ["governance-server"]
