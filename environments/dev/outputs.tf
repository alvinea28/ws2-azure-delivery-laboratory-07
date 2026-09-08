output "vnet_id" {
  description = "Managed VNet ID; not an instructor-owned resource."
  value       = module.network.vnet_id
}

output "subnet_ids" {
  description = "Subnet IDs keyed by stable names."
  value       = module.network.subnet_ids
}

output "nsg_id" {
  description = "Managed workload NSG ID."
  value       = module.network.nsg_id
}

output "association_ids" {
  description = "Association IDs keyed by subnet name."
  value       = module.network.association_ids
}
