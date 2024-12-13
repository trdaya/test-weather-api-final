# NestJS Weather API

A powerful wrapper for OpenWeatherMap Weather API, enriched with additional features such as rate limiting, caching, user-specific favorite locations, and background tasks for periodic weather updates.

---

## Setup Instructions

1. **Install dependencies**:
   Run `nvm use && npm i` from the project root. If you do not have `nvm`, manually switch to Node.js v22.12.0 before running the install script.

2. **Configure environment variables**:
   Copy `.env.example` to `.env` in the project root. Replace placeholder values with the actual secret keys (provided in the email). Adjust other variables as needed for production environments as indicated in `.env.example`.

3. **Start supporting services**:
   Run `docker-compose --env-file .env up --build` from the project root to start required services such as PostgreSQL and Redis.

4. **Run the server**:
   Open a new terminal tab and run `npm run start:dev` from the project root to start the development server.

---

## API Documentation

- **REST API**: OpenAPI/Swagger documentation is available at [http://localhost:4001/docs](http://localhost:4001/docs).
- **GraphQL Playground**: Access the GraphQL playground at [http://localhost:4001/graphql](http://localhost:4001/graphql).
- **Sample requests**: Use `docs/test.http` to run REST and GraphQL requests directly with the VSCode REST Client extension. Ensure `.vscode/settings.json` is configured with appropriate values as shown below:
  ```json
  {
    "rest-client.environmentVariables": {
      "local": {
        "baseUrl": "http://localhost:4001",
        "accessToken": "abc123", // of user 1
        "cookie": "refreshToken=def123; Max-Age=3599; Path=/; Expires=Thu, 12 Dec 2024 13:35:39 GMT", // of user 1
        "accessToken2": "abc1232", // of user 2
        "cookie2": "refreshToken=def1232; Max-Age=3599; Path=/; Expires=Thu, 12 Dec 2024 13:35:39 GMT" // of user 2
      }
    }
  }
  ```

---

## Features

1. **Retrieve weather details**:

   - `GET /weather/:city`: Fetch current weather for a given city.
   - `GET /forecast/:city`: Fetch a 5-day weather forecast for a given city.

2. **Favorite locations**:

   - `POST /locations`: Add a city to the user’s list of favorite locations.
   - `GET /locations`: Retrieve the user’s list of favorite locations.
   - `DELETE /locations/:id`: Remove a city from the user’s favorites.

3. **GraphQL endpoints**:

   - Accessible through `/graphql`.
   - Equivalent GraphQL queries and mutations for all major REST functionalities, including:
     - `getCurrentWeather`: Fetch current weather for a city.
     - `getFavoriteLocations`: Retrieve all favorite locations for the user.
     - `favoriteLocation`: Add a city to the user's list of favorite locations.

4. **Rate limiting**:

   - Limits 10 requests per minute (default) per IP, configurable via `.env`.

5. **Caching**:

   - Weather data is cached in Redis for improved performance and reduced API costs.
   - Invalid city names are cached for 6 hours to prevent redundant API calls for incorrect input.

6. **Background jobs**:

   - Hourly cron jobs fetch updated current weather data for all favorite cities and refresh the cache.
   - Every 3 hours, forecast weather data is fetched and cached for all favorite cities.

7. **Authentication**:

   - Protects user-specific endpoints using JWT-based authentication.
   - Includes access and refresh token mechanisms:
     - Access tokens are used for API calls.
     - Refresh tokens are stored in `HttpOnly` cookies for enhanced security.

8. **Logging**:
   - All major actions are logged for debugging and monitoring.

---

## Caching Strategy

- Weather data is cached in Redis to reduce redundant calls to the external Weather API.
- When a user requests weather for a city:
  - If data exists in Redis, it is returned directly.
  - If not, the external API is called, and the response is cached.
- Invalid city names are cached for 6 hours under a special key to reduce unnecessary API hits for repeated invalid requests.

---

## Rate Limiting

- The throttler is configured to allow 10 requests per minute (default).
- Exceeding the limit results in a `429 Too Many Requests` response.
- Both REST and GraphQL requests are tracked and throttled together.

---

## Database Optimizations

- Added indexes to commonly queried fields in `User` and `Location` entities to optimize database performance.
- Migrations are available under `src/migrations`, and the application includes scripts in `package.json` to create and run migrations easily.

### Indexing Strategy

- B-Tree Index is chosen for the `name` column as it is optimized for equality checks (e.g., WHERE name = 'Paris'). It is lightweight and ideal for single-city lookups.
- If future requirements involve complex queries like searching by multiple cities or full-text search, transitioning to a GIN index with `to_tsvector` could efficiently address them.

---

## Security

- Added security headers using `helmet` to protect against common web vulnerabilities.
- Enabled CORS for `allowedOrigins` specified in the `.env` file to restrict access to trusted domains only.

---

## Design Assumptions and Decisions

1. **City name ambiguity**:

   - The requirement specified `GET /weather/:city`, which assumes city names are globally unique. However, city names can exist in multiple countries (e.g., London in the UK and US). Ideally, the API should accept a `countryCode` alongside `city` to resolve ambiguities.

2. **Caching invalid city names**:

   - Invalid city names are cached for 6 hours since global city names rarely change. This reduces redundant API calls for repeated invalid requests.

3. **User and favorite limits**:
   - The total number of users is restricted to 4 (configurable via `.env`).
   - Each user is restricted to 3 favorite locations (configurable via `.env`).

---

## Testing Approach

- **Unit tests**:
  - Two services (e.g., WeatherService and LocationService) have comprehensive unit tests for all major methods.
- **Integration tests**:
  - Authentication, caching, and rate limiting were tested across REST and GraphQL endpoints.
- **Manual testing**:
  - REST and GraphQL requests were manually validated using Postman and the VSCode REST Client.

---

## Logging Strategy

- **Pino logger**:
  - Configured to log errors, warnings, and info messages.
  - Logs are stored in files and output to the console for easier debugging.

---

## Known Limitations

1. **Lack of bulk weather queries**:
   - The current implementation does not support fetching weather for multiple cities in a single API call, as this feature is not available under OpenWeatherMap's free plan. However, the implementation efficiently handles multiple requests by batching them, introducing delays between batches, and using `Promise.all` and `Promise.allSettled` for concurrency and error handling.

---
