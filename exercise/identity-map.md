# Identity and state map

TODO: explain Reader for the AZURE_PLAN_CLIENT_ID and workload-RG Contributor
for the distinct AZURE_APPLY_CLIENT_ID. Both need Storage Blob Data Contributor
on the assigned STATE_CONTAINER because acquiring a state lease needs writes.
STATE_KEY selects dev state; naming alone is not an RBAC isolation boundary.
