# Only this deployment root configures providers. No ambient CLI fallback.
provider "azurerm" {
  features {}

  use_oidc                        = true
  use_cli                         = false
  storage_use_azuread             = true
  resource_provider_registrations = "none"
}
