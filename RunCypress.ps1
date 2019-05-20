Param(
    [Parameter(Mandatory = $false)]
    [String]
    $options
)

$command = "npx cypress run"

if (-not ([string]::IsNullOrEmpty($options))){
    $command += " $options"
}

iex $command
