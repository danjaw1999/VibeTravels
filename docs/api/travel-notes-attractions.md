# Travel Notes Attractions API

## Generate Attraction Suggestions

Generate attraction suggestions based on a travel note's content.

```http
GET /api/travel-notes/:id/attractions/generate
```

### Query Parameters

| Parameter | Type     | Description                                                |
|-----------|----------|------------------------------------------------------------|
| limit     | number   | Maximum number of suggestions to generate (default: 10)     |
| exclude   | string   | Comma-separated list of attraction names to exclude         |

### Response

```json
{
  "suggestions": [
    {
      "name": "string",
      "description": "string",
      "latitude": number,
      "longitude": number,
      "image": "string | null",
      "estimatedPrice": "string"
    }
  ]
}
```

### Error Responses

| Status | Description                                        |
|--------|----------------------------------------------------|
| 400    | Invalid query parameters                           |
| 404    | Travel note not found                             |
| 500    | Internal server error or OpenAI API error         |

## Add Attractions to Travel Note

Add one or more attractions to an existing travel note.

```http
POST /api/travel-notes/:id/attractions
```

### Request Body

```json
{
  "attractions": [
    {
      "name": "string",
      "description": "string",
      "latitude": number,
      "longitude": number,
      "image": "string | null"
    }
  ]
}
```

### Response

```json
{
  "attractions": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "latitude": number,
      "longitude": number,
      "image": "string | null",
      "createdAt": "string"
    }
  ]
}
```

### Error Responses

| Status | Description                                        |
|--------|----------------------------------------------------|
| 400    | Invalid request body                              |
| 401    | Unauthorized - User not authenticated             |
| 403    | Forbidden - User does not own the travel note     |
| 404    | Travel note not found                             |
| 500    | Internal server error                             |

## Examples

### Generate Suggestions

```bash
# Generate 5 new suggestions
curl -X GET "/api/travel-notes/123/attractions/generate?limit=5"

# Generate suggestions excluding certain attractions
curl -X GET "/api/travel-notes/123/attractions/generate?exclude=Eiffel%20Tower,Louvre"
```

### Add Attractions

```bash
curl -X POST "/api/travel-notes/123/attractions" \
  -H "Content-Type: application/json" \
  -d '{
    "attractions": [
      {
        "name": "Eiffel Tower",
        "description": "Iconic iron lattice tower on the Champ de Mars",
        "latitude": 48.8584,
        "longitude": 2.2945
      }
    ]
  }'
``` 