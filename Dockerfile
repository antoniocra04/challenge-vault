FROM --platform=$BUILDPLATFORM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/vendor ./vendor
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM --platform=$BUILDPLATFORM golang:1.26.11-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal
COPY --from=frontend /app/internal/web/spa/generated ./internal/web/spa/generated
ARG TARGETOS
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -tags embedspa -trimpath -ldflags="-s -w" -o /vault ./cmd/vault

FROM alpine:3.23
RUN apk add --no-cache ca-certificates tzdata \
 && addgroup -S -g 1001 vault \
 && adduser -S -H -u 1001 -G vault vault \
 && mkdir -p /data/vault /data/uploads \
 && chown -R vault:vault /data
COPY --from=build /vault /usr/local/bin/vault
ENV PORT=3000 SQLITE_PATH=/data/vault/vault.sqlite UPLOAD_DIR=/data/uploads
USER vault
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["vault", "healthcheck"]
ENTRYPOINT ["vault"]
