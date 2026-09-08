variable "name" {
  description = "Approved VNet name for this dev workload."
  type        = string
}

variable "resource_group_name" {
  description = "Existing instructor-owned workload RG; it is not managed here."
  type        = string
}

variable "location" {
  description = "Instructor-approved Azure region."
  type        = string
}

variable "address_space" {
  description = "Approved IPv4 address spaces; the module validates syntax."
  type        = list(string)

  validation {
    condition     = length(var.address_space) > 0 && alltrue([for prefix in var.address_space : can(cidrnetmask(prefix))])
    error_message = "The dev consumer requires valid IPv4 address-space CIDRs."
  }
}

variable "subnets" {
  description = "Stable subnet-name map. Add app in the capstone, keeping web/data."
  type = map(object({
    address_prefixes = list(string)
  }))
}

variable "tags" {
  description = "Nonblank owner, environment, cost_center and workshop tags."
  type        = map(string)
}
