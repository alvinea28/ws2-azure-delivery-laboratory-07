# AgentAlvine | Complete D1.3-D1.4 reference. The caller owns provider and state.
resource "azurerm_virtual_network" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  address_space       = var.address_space
  tags                = var.tags
}

# Standalone subnets only: the caller's stable names are Terraform instance keys.
resource "azurerm_subnet" "this" {
  for_each = var.subnets

  name                            = each.key
  resource_group_name             = var.resource_group_name
  virtual_network_name            = azurerm_virtual_network.this.name
  address_prefixes                = each.value.address_prefixes
  default_outbound_access_enabled = false
}

module "security" {
  source = "./modules/subnet-security"

  name                = "${var.name}-nsg"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_ids          = { for name, subnet in azurerm_subnet.this : name => subnet.id }
  tags                = var.tags
  rules               = var.security_rules
}
