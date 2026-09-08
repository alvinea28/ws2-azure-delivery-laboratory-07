# This starter consumes the complete instructor checkpoint by immutable revision.
# D1.7 replaces it with the reviewed v1.0.0 public root of the TEAM module copy.
# Verified instructor source commit; a checkpoint is not a learner release tag.
module "network" {
  source = "git::https://github.com/alvinea28/ws2-azure-delivery-laboratory-07.git//module?ref=4414e56b409a46785590741adcc48abea29905d7"

  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  address_space       = var.address_space
  subnets             = var.subnets
  tags                = var.tags
}
