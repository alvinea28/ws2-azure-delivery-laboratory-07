# Account/container/key come from the instructor's protected configuration.
# No client IDs/secrets or access keys are embedded in a saved backend config.
terraform {
  backend "azurerm" {
    use_oidc         = true
    use_azuread_auth = true
  }
}
