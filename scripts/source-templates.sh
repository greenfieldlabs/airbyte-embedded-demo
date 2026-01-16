#!/bin/bash
#
# Airbyte Embedded Source Templates Management Script
#
# Usage:
#   ./source-templates.sh create <json>     Create a new source template
#   ./source-templates.sh update <id> <json> Update an existing source template
#   ./source-templates.sh get <id>          Get a source template by ID
#   ./source-templates.sh list              List all source templates
#   ./source-templates.sh delete <id>       Delete a source template
#
# JSON format (user-friendly):
#   {
#     "name": "Connector Name",
#     "workspaceId": "uuid",
#     "definitionId": "uuid",
#     "configuration": { ... }
#   }
#
# Environment variables required:
#   SONAR_AIRBYTE_CLIENT_ID
#   SONAR_AIRBYTE_CLIENT_SECRET
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../apps/server/.env"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# Validate required environment variables
if [ -z "$SONAR_AIRBYTE_CLIENT_ID" ] || [ -z "$SONAR_AIRBYTE_CLIENT_SECRET" ]; then
    echo "Error: SONAR_AIRBYTE_CLIENT_ID and SONAR_AIRBYTE_CLIENT_SECRET must be set" >&2
    echo "Either set them in your environment or in $ENV_FILE" >&2
    exit 1
fi

# API endpoints
AUTH_URL="https://api.airbyte.com/v1/applications/token"
API_BASE_URL="https://api.airbyte.ai/api/v1"

# Get access token
get_access_token() {
    local response
    response=$(curl -s -X POST "$AUTH_URL" \
        -H 'Content-Type: application/json' \
        -H 'Accept: application/json' \
        -d "{\"client_id\": \"$SONAR_AIRBYTE_CLIENT_ID\", \"client_secret\": \"$SONAR_AIRBYTE_CLIENT_SECRET\", \"grant-type\": \"client_credentials\"}")

    local token
    token=$(echo "$response" | jq -r '.access_token')

    if [ "$token" == "null" ] || [ -z "$token" ]; then
        echo "Error: Failed to get access token" >&2
        echo "$response" >&2
        exit 1
    fi

    echo "$token"
}

# Transform user-friendly JSON to API format
transform_to_api_format() {
    local input_json="$1"
    echo "$input_json" | jq '{
        name: .name,
        workspaceId: .workspaceId,
        actor_definition_id: .definitionId,
        partial_default_config: .configuration,
        original_source_template_id: null
    }'
}

# Transform API response to user-friendly format
transform_from_api_format() {
    local api_json="$1"
    echo "$api_json" | jq '{
        id: .id,
        name: .name,
        icon: .icon,
        definitionId: .source_definition_id,
        configuration: .partial_default_config,
        createdAt: .created_at,
        updatedAt: .updated_at
    }'
}

# Create source template
cmd_create() {
    local json="$1"

    if [ -z "$json" ]; then
        echo "Error: JSON input required" >&2
        echo "Usage: $0 create '<json>'" >&2
        exit 1
    fi

    local token
    token=$(get_access_token)

    local api_json
    api_json=$(transform_to_api_format "$json")

    local response
    response=$(curl -s -X POST "${API_BASE_URL}/integrations/templates/sources" \
        -H "Authorization: Bearer $token" \
        -H 'Content-Type: application/json' \
        -H 'Accept: application/json' \
        -d "$api_json")

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        echo "Source template created successfully:"
        transform_from_api_format "$response"
    else
        echo "Error creating source template:" >&2
        echo "$response" | jq . >&2
        exit 1
    fi
}

# Update source template
cmd_update() {
    local id="$1"
    local json="$2"

    if [ -z "$id" ] || [ -z "$json" ]; then
        echo "Error: ID and JSON input required" >&2
        echo "Usage: $0 update <id> '<json>'" >&2
        exit 1
    fi

    local token
    token=$(get_access_token)

    local api_json
    api_json=$(transform_to_api_format "$json")

    local response
    response=$(curl -s -X PUT "${API_BASE_URL}/integrations/templates/sources/${id}" \
        -H "Authorization: Bearer $token" \
        -H 'Content-Type: application/json' \
        -H 'Accept: application/json' \
        -d "$api_json")

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        echo "Source template updated successfully:"
        transform_from_api_format "$response"
    else
        echo "Error updating source template:" >&2
        echo "$response" | jq . >&2
        exit 1
    fi
}

# Get source template by ID
cmd_get() {
    local id="$1"

    if [ -z "$id" ]; then
        echo "Error: ID required" >&2
        echo "Usage: $0 get <id>" >&2
        exit 1
    fi

    local token
    token=$(get_access_token)

    local response
    response=$(curl -s -X GET "${API_BASE_URL}/integrations/templates/sources/${id}" \
        -H "Authorization: Bearer $token" \
        -H 'Accept: application/json')

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        transform_from_api_format "$response"
    else
        echo "Error getting source template:" >&2
        echo "$response" | jq . >&2
        exit 1
    fi
}

# List all source templates
cmd_list() {
    local token
    token=$(get_access_token)

    local response
    response=$(curl -s -X GET "${API_BASE_URL}/integrations/templates/sources" \
        -H "Authorization: Bearer $token" \
        -H 'Accept: application/json')

    # Check for HTML error response
    if echo "$response" | grep -q "^<html>" 2>/dev/null; then
        echo "Error: API returned HTML error page (service may be temporarily unavailable)" >&2
        echo "$response" >&2
        exit 1
    fi

    # Handle different response formats
    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        echo "$response" | jq '.data[] | {
            id: .id,
            name: .name,
            definitionId: .source_definition_id,
            createdAt: .created_at
        }'
    elif echo "$response" | jq -e 'type == "array"' > /dev/null 2>&1; then
        echo "$response" | jq '.[] | {
            id: .id,
            name: .name,
            definitionId: .source_definition_id,
            createdAt: .created_at
        }'
    else
        echo "$response" | jq .
    fi
}

# Delete source template
cmd_delete() {
    local id="$1"

    if [ -z "$id" ]; then
        echo "Error: ID required" >&2
        echo "Usage: $0 delete <id>" >&2
        exit 1
    fi

    local token
    token=$(get_access_token)

    local response
    response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_BASE_URL}/integrations/templates/sources/${id}" \
        -H "Authorization: Bearer $token" \
        -H 'Accept: application/json')

    local http_code
    http_code=$(echo "$response" | tail -n1)
    local body
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "200" ] || [ "$http_code" == "204" ]; then
        echo "Source template deleted successfully"
    else
        echo "Error deleting source template (HTTP $http_code):" >&2
        echo "$body" | jq . 2>/dev/null || echo "$body" >&2
        exit 1
    fi
}

# Show usage
usage() {
    echo "Airbyte Embedded Source Templates Management"
    echo ""
    echo "Usage:"
    echo "  $0 create '<json>'        Create a new source template"
    echo "  $0 update <id> '<json>'   Update an existing source template"
    echo "  $0 get <id>               Get a source template by ID"
    echo "  $0 list                   List all source templates"
    echo "  $0 delete <id>            Delete a source template"
    echo ""
    echo "JSON format:"
    echo '  {'
    echo '    "name": "Connector Name",'
    echo '    "workspaceId": "uuid",'
    echo '    "definitionId": "uuid",'
    echo '    "configuration": { ... }'
    echo '  }'
    echo ""
    echo "Examples:"
    echo "  $0 create '{\"name\": \"Shopify\", \"workspaceId\": \"...\", \"definitionId\": \"...\", \"configuration\": {}}'"
    echo "  $0 list"
    echo "  $0 get f69ceee8-7617-4304-9b8f-2a388c21fc0b"
}

# Main
case "${1:-}" in
    create)
        cmd_create "$2"
        ;;
    update)
        cmd_update "$2" "$3"
        ;;
    get)
        cmd_get "$2"
        ;;
    list)
        cmd_list
        ;;
    delete)
        cmd_delete "$2"
        ;;
    -h|--help|help|"")
        usage
        ;;
    *)
        echo "Unknown command: $1" >&2
        usage
        exit 1
        ;;
esac
