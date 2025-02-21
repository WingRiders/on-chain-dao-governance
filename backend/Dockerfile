FROM node:20.13-alpine as build

# copy the root package.json an all frontend build deps
# not using a global yarn install, but relying on the
# yarn focus to ensure locked versions
# https://github.com/yarnpkg/berry/issues/1803
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn/
COPY sdk/package.json sdk/
COPY backend/package.json backend/
RUN yarn workspaces focus --all

COPY sdk sdk
COPY backend backend

ENV NODE_ENV production
RUN yarn workspace @wingriders/governance-sdk build
RUN yarn workspace @wingriders/governance-backend prisma:generate
RUN yarn workspace @wingriders/governance-backend build

FROM node:20.13-alpine as deps

WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn/
COPY sdk/package.json sdk/
COPY backend/package.json backend/

ENV NODE_ENV production
RUN yarn workspaces focus --all --production

FROM node:20.13-alpine as server

EXPOSE 3240
EXPOSE 3241
ENV NODE_ENV production
ARG REVISION
ENV REVISION=$REVISION

WORKDIR /usr/app

COPY --from=deps /usr/app/ ./
COPY --from=build /usr/app/sdk/dist sdk/dist
# COPY backend/governance backend/governance/
# includes also the built prisma client
COPY --from=build /usr/app/backend backend
COPY --from=build /usr/app/backend/.env.prod backend/.env

CMD ["/bin/sh", "-c", "yarn workspace @wingriders/governance-backend start"]
