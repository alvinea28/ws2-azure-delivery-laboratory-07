output "vnet_id" {
  description = "Azure resource ID of the virtual network."
  value       = azurerm_virtual_network.this.id
}

output "subnet_ids" {
  description = "Subnet resource IDs keyed by the caller's stable subnet names."
  value       = tomap({ for name, subnet in azurerm_subnet.this : name => subnet.id })
}

output "nsg_id" {
  description = "Azure resource ID of the composed network security group."
  value       = module.security.nsg_id
}

output "association_ids" {
  description = "NSG association IDs keyed by subnet name; Azure uses the subnet ID for each association."
  value       = module.security.association_ids
}
