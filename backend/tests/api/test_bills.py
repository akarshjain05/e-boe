from fastapi.testclient import TestClient


def test_create_bill_validation_error(authorized_client: TestClient):
    response = authorized_client.post(
        "/api/v1/bills",
        json={
            "bill_number": "BOE-001"
            # Missing other required fields
        }
    )
    assert response.status_code == 422

def test_get_bills_empty(authorized_client: TestClient):
    response = authorized_client.get("/api/v1/bills")
    assert response.status_code == 200
    assert response.json() == []

# In a full test suite, we would add tests for:
# - Successful bill creation (requires creating a Customer first)
# - State transitions (draft -> pending_acceptance -> accepted)
# - Payment validation logic
