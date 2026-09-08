# AgentAlvine | Complete D1.4 reference. Dependencies arrive through inputs.
# Empty custom rules leave Azure's default NSG rules in place, including internal
# VirtualNetwork access. This is not zero trust or a complete egress policy.
resource "azurerm_network_security_group" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.tags
}

# Standalone rules only; never mix these with inline NSG security_rule blocks.
resource "azurerm_network_security_rule" "this" {
  for_each = var.rules

  name                        = each.key
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.this.name
  priority                    = each.value.priority
  direction                   = each.value.direction
  access                      = each.value.access
  protocol                    = each.value.protocol
  source_port_range           = each.value.source_port_range
  destination_port_range      = each.value.destination_port_range
  source_address_prefix       = each.value.source_address_prefix
  destination_address_prefix  = each.value.destination_address_prefix
  description                 = each.value.description
}

resource "azurerm_subnet_network_security_group_association" "this" {
  for_each = var.subnet_ids

  subnet_id                 = each.value
  network_security_group_id = azurerm_network_security_group.this.id

  # Finish custom rules before associating. Azure defaults still remain in force.
  depends_on = [azurerm_network_security_rule.this]
}
