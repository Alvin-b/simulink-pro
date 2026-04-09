FROM rust:1.82-slim AS build

WORKDIR /app

COPY services/simforge-core-rs/Cargo.toml ./Cargo.toml
COPY services/simforge-core-rs/src ./src

RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

COPY --from=build /app/target/release/simforge-core-rs /usr/local/bin/simforge-core-rs

EXPOSE 4041

CMD ["simforge-core-rs"]
