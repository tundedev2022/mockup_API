FROM dart:stable

WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
RUN dart pub get --enforce-lockfile

COPY . .
RUN dart analyze

EXPOSE 8080

CMD ["dart", "run", "mock_server.dart"]
