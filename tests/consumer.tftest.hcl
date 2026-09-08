# Mock provider runs only: no backend, OIDC, Azure CLI or Azure calls.
mock_provider "azurerm" {}

override_resource {
  target = module.network.azurerm_virtual_network.this
  values = {
    id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-ws2-team01-existing/providers/Microsoft.Network/virtualNetworks/ws2-team01-dev"
  }
}

override_resource {
  target = module.network.azurerm_subnet.this["web"]
  values = {
    id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-ws2-team01-existing/providers/Microsoft.Network/virtualNetworks/ws2-team01-dev/subnets/web"
  }
}

override_resource {
  target = module.network.azurerm_subnet.this["data"]
  values = {
    id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-ws2-team01-existing/providers/Microsoft.Network/virtualNetworks/ws2-team01-dev/subnets/data"
  }
}

override_resource {
  target = module.network.module.security.azurerm_network_security_group.this
  values = {
    id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-ws2-team01-existing/providers/Microsoft.Network/networkSecurityGroups/ws2-team01-dev-nsg"
  }
}

variables {
  name                = "ws2-team01-dev"
  resource_group_name = "rg-ws2-team01-existing"
  location            = "southeastasia"
  address_space       = ["10.42.0.0/16"]
  subnets = {
    web  = { address_prefixes = ["10.42.1.0/24"] }
    data = { address_prefixes = ["10.42.2.0/24"] }
  }
  tags = {
    owner       = "team01"
    environment = "dev"
    cost_center = "training"
    workshop    = "ws2"
  }
}

run "consumer_preserves_named_topology" {
  command = plan

  assert {
    condition     = toset(keys(output.subnet_ids)) == toset(["web", "data"])
    error_message = "The composed dev consumer must preserve both named subnets."
  }

  assert {
    condition     = toset(keys(output.association_ids)) == toset(keys(output.subnet_ids))
    error_message = "Every managed subnet requires an NSG association."
  }
}

run "reject_bad_consumer_cidr" {
  command = plan
  variables {
    address_space = ["not-a-cidr"]
  }
  expect_failures = [var.address_space]
}
