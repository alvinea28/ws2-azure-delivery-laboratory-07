output "nsg_id" {
  description = "Azure resource ID of the network security group."
  value       = azurerm_network_security_group.this.id
}

output "association_ids" {
  description = "NSG association IDs keyed by the supplied stable subnet names; association IDs are subnet IDs in AzureRM."
  value       = tomap({ for name, association in azurerm_subnet_network_security_group_association.this : name => association.id })
}
