import {useEffect, useState} from "react";

function App() {
  const [token, setToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [rules, setRules] = useState([]);
  const [username, setUsername] = useState("");
  const [orgId, setOrgId] = useState("");

  // Get Access Token After Login
  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.substring(1));

      const accessToken = params.get("access_token");

      const instance = params.get("instance_url");

      setToken(accessToken);

      setInstanceUrl(instance);

      getUserInfo(accessToken, instance);
    }
  }, []);

  // Salesforce Login
  const login = () => {
    const clientId =
      "3MVG97L7PWbPq6Uyzciq_R4T7aMreB7iAYYdvlwYMyKtYLFKZShvaug.G4sz6UJcwX9xNZyIsa7qNvXsfohMl";

    const redirectUri = "https://sf-validation-manager-muqh.onrender.com";

    const authUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}`;

    window.location.href = authUrl;
  };

  // Get User Information
  const getUserInfo = async (accessToken, instance) => {
    try {
      const response = await fetch(`${instance}/services/oauth2/userinfo`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      console.log(data);

      setUsername(data.preferred_username || data.email || "No Username");

      setOrgId(data.organization_id || "No Org ID");
    } catch (error) {
      console.log(error);

      setUsername("Unable to Fetch");

      setOrgId("Unable to Fetch");
    }
  };

  // Fetch Validation Rules
  const getValidationRules = async () => {
    try {
      const query =
        "SELECT Id, ValidationName, Active FROM ValidationRule LIMIT 10";

      const url = `${instanceUrl}/services/data/v58.0/tooling/query/?q=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      console.log(data);

      setRules(data.records || []);
    } catch (error) {
      console.log(error);

      alert("Error fetching validation rules");
    }
  };

  // Toggle Validation Rule
  const toggleRule = async (rule) => {
    try {
      const getUrl = `${instanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${rule.Id}`;

      // Get Full Metadata
      const getResponse = await fetch(getUrl, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const ruleData = await getResponse.json();

      console.log(ruleData);

      // Toggle Active Status
      ruleData.Metadata.active = !rule.Active;

      // Update Validation Rule
      const updateResponse = await fetch(getUrl, {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          Metadata: ruleData.Metadata,
        }),
      });

      if (updateResponse.ok) {
        alert("Validation Rule Updated Successfully ✅");

        getValidationRules();
      } else {
        const errorData = await updateResponse.json();

        console.log(errorData);

        alert("Failed to update validation rule");
      }
    } catch (error) {
      console.log(error);

      alert("Error updating validation rule");
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>Salesforce Validation Rule Manager</h1>

      {!token ? (
        <button
          onClick={login}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Login to Salesforce
        </button>
      ) : (
        <div>
          <h2>Login Successful ✅</h2>

          <p>
            <strong>Username:</strong> {username}
          </p>

          <p>
            <strong>Org ID:</strong> {orgId}
          </p>

          <button
            onClick={getValidationRules}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              marginBottom: "20px",
              cursor: "pointer",
            }}
          >
            Get Validation Rules
          </button>

          {rules &&
            rules.map((rule) => (
              <div
                key={rule.Id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "15px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <h3>{rule.ValidationName}</h3>

                <p>
                  Status:{" "}
                  <strong
                    style={{
                      color: rule.Active ? "green" : "red",
                    }}
                  >
                    {rule.Active ? "Active" : "Inactive"}
                  </strong>
                </p>

                <button
                  onClick={() => toggleRule(rule)}
                  style={{
                    padding: "8px 15px",
                    cursor: "pointer",
                  }}
                >
                  Active/Inactive
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default App;
