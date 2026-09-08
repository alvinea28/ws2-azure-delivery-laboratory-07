variable "name" {
  description = "Virtual-network name: 1-64 lowercase letters, digits or hyphens, starting with a letter and ending with a letter/digit. The NSG appends -nsg."
  type        = string
  nullable    = false

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]{0,62}[a-z0-9])?$", var.name))
    error_message = "name must be a 1-64 character lowercase name, starting with a letter and ending with a letter or digit."
  }
}

variable "resource_group_name" {
  description = "Name of the existing, instructor-managed workload resource group. This module never creates or looks up the group."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.resource_group_name)) > 0 && var.resource_group_name == trimspace(var.resource_group_name)
    error_message = "resource_group_name must be nonblank and have no leading or trailing whitespace."
  }
}

variable "location" {
  description = "Azure region selected by the caller; resource-provider registration and regional/policy readiness are instructor prerequisites."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.location)) > 0 && var.location == trimspace(var.location)
    error_message = "location must be nonblank and have no leading or trailing whitespace."
  }
}

variable "address_space" {
  description = "Nonempty list of IPv4 VNet CIDRs. Syntax is checked; containment, overlap, Azure size limits and organizational allocation remain caller/preflight responsibilities."
  type        = list(string)
  nullable    = false

  validation {
    condition     = length(var.address_space) > 0 && alltrue([for prefix in var.address_space : can(cidrnetmask(prefix))])
    error_message = "address_space must contain at least one syntactically valid IPv4 CIDR."
  }
}

variable "subnets" {
  description = "Nonempty map of subnet objects keyed by stable Azure subnet names (lowercase letters/digits/hyphens, 1-80 characters). Adding a key does not renumber existing resources."
  type = map(object({
    address_prefixes = list(string)
  }))
  nullable = false

  validation {
    condition     = length(var.subnets) > 0 && alltrue([for name in keys(var.subnets) : can(regex("^[a-z]([a-z0-9-]{0,78}[a-z0-9])?$", name))])
    error_message = "subnets must contain at least one stable 1-80 character lowercase name, starting with a letter and ending with a letter or digit."
  }

  validation {
    condition = alltrue([
      for subnet in values(var.subnets) : try(
        length(subnet.address_prefixes) > 0 && alltrue([for prefix in subnet.address_prefixes : can(cidrnetmask(prefix))]),
        false
      )
    ])
    error_message = "Every subnet must contain at least one syntactically valid IPv4 address_prefixes CIDR."
  }
}

variable "tags" {
  description = "VNet/NSG tags. owner, environment, cost_center and workshop are required; every supplied tag key/value must be nonblank. Subnets and associations do not support tags."
  type        = map(string)
  nullable    = false

  validation {
    condition = alltrue([
      for key in ["owner", "environment", "cost_center", "workshop"] : try(length(trimspace(var.tags[key])) > 0, false)
      ]) && alltrue([
      for key, value in var.tags : length(trimspace(key)) > 0 && try(length(trimspace(value)) > 0, false)
    ])
    error_message = "tags must include nonblank owner, environment, cost_center and workshop values, and no supplied tag key/value may be blank."
  }
}

variable "security_rules" {
  description = "Custom NSG rules keyed by stable rule names. Empty by default: Azure default rules still allow VirtualNetwork/AzureLoadBalancer inbound before default deny. Inbound Allow sources must be explicit IPv4 CIDRs wholly inside RFC1918; no public/IPv6 sources or service tags. Other prefixes accept CIDRs, *, VirtualNetwork, AzureLoadBalancer or Internet. This is not zero trust or an egress policy."
  type = map(object({
    priority                   = number
    direction                  = string
    access                     = string
    protocol                   = string
    source_port_range          = optional(string, "*")
    destination_port_range     = string
    source_address_prefix      = string
    destination_address_prefix = string
    description                = optional(string, "")
  }))
  default  = {}
  nullable = false

  validation {
    condition     = alltrue([for name in keys(var.security_rules) : can(regex("^[a-z]([a-z0-9-]{0,78}[a-z0-9])?$", name))])
    error_message = "Rule names must be stable lowercase 1-80 character names, starting with a letter and ending with a letter or digit."
  }

  validation {
    condition = try(alltrue([
      for rule in values(var.security_rules) :
      contains(["Inbound", "Outbound"], rule.direction) &&
      contains(["Allow", "Deny"], rule.access) &&
      contains(["Tcp", "Udp", "Icmp", "Esp", "Ah", "*"], rule.protocol)
    ]), false)
    error_message = "Rules require direction Inbound/Outbound, access Allow/Deny, and protocol Tcp/Udp/Icmp/Esp/Ah/*. Values are case-sensitive."
  }

  validation {
    condition = try(alltrue([
      for rule in values(var.security_rules) : rule.priority >= 100 && rule.priority <= 4096 && floor(rule.priority) == rule.priority
    ]), false)
    error_message = "Rule priorities must be integers from 100 through 4096."
  }

  validation {
    condition     = try(length(distinct([for rule in values(var.security_rules) : "${rule.direction}:${rule.priority}"])) == length(var.security_rules), false)
    error_message = "Rule priorities must be unique within each direction; Inbound and Outbound may reuse a priority."
  }

  validation {
    condition = try(alltrue([
      for port in flatten([for rule in values(var.security_rules) : [rule.source_port_range, rule.destination_port_range]]) :
      port == "*" || try(
        can(regex("^[0-9]{1,5}(-[0-9]{1,5})?$", port)) &&
        alltrue([for part in split("-", port) : tonumber(part) >= 0 && tonumber(part) <= 65535]) &&
        tonumber(split("-", port)[0]) <= tonumber(reverse(split("-", port))[0]),
        false
      )
    ]), false)
    error_message = "Ports must be *, an integer 0-65535, or an ascending inclusive range such as 443-445; lists, whitespace and decimals are not supported."
  }

  validation {
    condition = try(alltrue([
      for rule in values(var.security_rules) : contains(["Icmp", "Esp", "Ah"], rule.protocol) ? rule.source_port_range == "*" && rule.destination_port_range == "*" : true
    ]), false)
    error_message = "Icmp, Esp and Ah rules must use * for both port ranges."
  }

  validation {
    condition = try(alltrue([
      for prefix in flatten([for rule in values(var.security_rules) : [rule.source_address_prefix, rule.destination_address_prefix]]) :
      contains(["*", "VirtualNetwork", "AzureLoadBalancer", "Internet"], prefix) || can(cidrhost(prefix, 0))
    ]), false)
    error_message = "Address prefixes must be CIDRs or *, VirtualNetwork, AzureLoadBalancer or Internet; bare IPs, ranges and other service tags are not supported."
  }

  validation {
    condition     = try(alltrue([for rule in values(var.security_rules) : length(rule.description) <= 140]), false)
    error_message = "Rule descriptions must not exceed 140 characters."
  }

  # BEGIN WS2_INGRESS_GUARD
  # Explicit RFC1918 containment rejects wildcard/service tags, public space,
  # every IPv4 /0 (even host-bit forms), and compressed/expanded IPv6 /0.
  # Whole RFC1918 blocks are accepted; callers should choose the smallest scope.
  validation {
    condition = try(alltrue([
      for rule in values(var.security_rules) : rule.direction == "Inbound" && rule.access == "Allow" ? try(
        can(cidrnetmask(rule.source_address_prefix)) && (
          (tonumber(split("/", rule.source_address_prefix)[1]) >= 8 && startswith(cidrhost(rule.source_address_prefix, 0), "10.")) ||
          (tonumber(split("/", rule.source_address_prefix)[1]) >= 12 && can(regex("^172\\.(1[6-9]|2[0-9]|3[01])\\.", cidrhost(rule.source_address_prefix, 0)))) ||
          (tonumber(split("/", rule.source_address_prefix)[1]) >= 16 && startswith(cidrhost(rule.source_address_prefix, 0), "192.168."))
        ),
        false
      ) : true
    ]), false)
    error_message = "Inbound Allow sources must be explicit IPv4 CIDRs contained in 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16; wildcard, Internet, other service tags, public CIDRs and IPv6 are prohibited."
  }
  # END WS2_INGRESS_GUARD
}
