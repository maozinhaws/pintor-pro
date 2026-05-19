<#
Pintor Plus MVP - bootstrap pos-formatacao

Uso recomendado, em PowerShell como Administrador:

  Set-ExecutionPolicy -Scope Process Bypass -Force
  .\scripts\bootstrap-workstation.ps1

Opcoes uteis:

  .\scripts\bootstrap-workstation.ps1 -SkipWsl
  .\scripts\bootstrap-workstation.ps1 -SkipAndroidStudio
  .\scripts\bootstrap-workstation.ps1 -SkipGlobalCli
  .\scripts\bootstrap-workstation.ps1 -SkipProjectRestore

Depois do script, faca login manual nas CLIs que exigem conta:

  claude
  codex
  gemini

Notas:
- WSL/Ubuntu e Android Studio podem exigir reinicio.
- O script preserva o projeto como fonte da verdade e nao apaga arquivos.
- "Hermes agente" neste projeto e o protocolo/documentacao em docs/HERMES_*.md + .agents/.
#>

[CmdletBinding()]
param(
  [switch]$SkipWinget,
  [switch]$SkipWsl,
  [switch]$SkipAndroidStudio,
  [switch]$SkipGlobalCli,
  [switch]$SkipProjectRestore,
  [switch]$SkipSkills,
  [switch]$RunAndroidBuild
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
  param([string]$Message)
  Write-Host "OK  $Message" -ForegroundColor Green
}

function Write-Warn {
  param([string]$Message)
  Write-Host "WARN $Message" -ForegroundColor Yellow
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-WingetPackage {
  param(
    [string]$Id,
    [string]$Name
  )

  if ($SkipWinget) {
    Write-Warn "Pulando winget: $Name"
    return
  }

  if (-not (Test-Command winget)) {
    throw "winget nao encontrado. Instale o App Installer pela Microsoft Store e rode novamente."
  }

  Write-Step "Verificando $Name"
  $installed = winget list --id $Id --exact --accept-source-agreements 2>$null
  if ($LASTEXITCODE -eq 0 -and ($installed -join "`n") -match [regex]::Escape($Id)) {
    Write-Ok "$Name ja instalado"
    return
  }

  Write-Step "Instalando $Name"
  winget install --id $Id --exact --accept-package-agreements --accept-source-agreements
}

function Install-NpmGlobal {
  param([string]$PackageName)

  if ($SkipGlobalCli) {
    Write-Warn "Pulando npm global: $PackageName"
    return
  }

  if (-not (Test-Command npm)) {
    throw "npm nao encontrado. Instale Node.js primeiro."
  }

  Write-Step "Instalando CLI global: $PackageName"
  npm install -g $PackageName
}

function Copy-DirectoryIfExists {
  param(
    [string]$Source,
    [string]$Destination
  )

  if (-not (Test-Path $Source)) {
    Write-Warn "Nao encontrado: $Source"
    return
  }

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Copy-Item -Path (Join-Path $Source '*') -Destination $Destination -Recurse -Force
  Write-Ok "Copiado: $Source -> $Destination"
}

function Restore-AgentSkills {
  if ($SkipSkills) {
    Write-Warn "Pulando restauracao de skills"
    return
  }

  Write-Step "Restaurando skills locais do projeto"
  $projectSkills = Join-Path $ProjectRoot '.agents\skills'
  $userAgentsSkills = Join-Path $env:USERPROFILE '.agents\skills'
  $userCodexSkills = Join-Path $env:USERPROFILE '.codex\skills'

  Copy-DirectoryIfExists -Source $projectSkills -Destination $userAgentsSkills
  Copy-DirectoryIfExists -Source $projectSkills -Destination $userCodexSkills
}

function Install-WslUbuntu {
  if ($SkipWsl) {
    Write-Warn "Pulando WSL/Ubuntu"
    return
  }

  if (-not (Test-Admin)) {
    Write-Warn "WSL/Ubuntu precisa de PowerShell como Administrador. Pulando."
    return
  }

  if (-not (Test-Command wsl)) {
    Write-Step "Instalando WSL com Ubuntu"
    wsl --install -d Ubuntu
    Write-Warn "Reinicie o PC se o Windows solicitar. Depois rode este script novamente."
    return
  }

  $distros = wsl --list --quiet 2>$null
  if (($distros -join "`n") -match 'Ubuntu') {
    Write-Ok "Ubuntu no WSL ja instalado"
    return
  }

  Write-Step "Instalando Ubuntu no WSL"
  wsl --install -d Ubuntu
  Write-Warn "Reinicie o PC se o Windows solicitar. Depois rode este script novamente."
}

function Restore-Project {
  if ($SkipProjectRestore) {
    Write-Warn "Pulando restore do projeto"
    return
  }

  Write-Step "Instalando dependencias npm do projeto"
  Push-Location $ProjectRoot
  try {
    npm install

    Write-Step "Rodando build web"
    npm run build

    Write-Step "Sincronizando Capacitor Android"
    npx cap sync android

    if ($RunAndroidBuild) {
      Write-Step "Rodando assembleDebug Android"
      Push-Location (Join-Path $ProjectRoot 'android')
      try {
        .\gradlew.bat assembleDebug
      } finally {
        Pop-Location
      }
    } else {
      Write-Warn "assembleDebug nao foi rodado. Use -RunAndroidBuild quando o JDK/Android SDK estiverem prontos."
    }
  } finally {
    Pop-Location
  }
}

function Show-NextSteps {
  Write-Host ""
  Write-Host "Proximos passos manuais:" -ForegroundColor Cyan
  Write-Host "1. Abra Android Studio uma vez e deixe instalar SDK/Build Tools se pedir."
  Write-Host "2. Faca login nas CLIs: claude, codex, gemini."
  Write-Host "3. Abra o projeto e leia docs/HERMES_SESSION_MEMORY.md."
  Write-Host "4. Se o Gradle reclamar de jlink/JDK, configure Android Studio/JDK 21 e rode:"
  Write-Host "   .\scripts\bootstrap-workstation.ps1 -RunAndroidBuild"
  Write-Host ""
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

Write-Step "Bootstrap Pintor Plus MVP"
Write-Host "Projeto: $ProjectRoot"

if (-not (Test-Admin)) {
  Write-Warn "PowerShell nao esta como Administrador. Winget pode funcionar, mas WSL pode ser pulado."
}

Install-WingetPackage -Id 'Git.Git' -Name 'Git'
Install-WingetPackage -Id 'OpenJS.NodeJS.LTS' -Name 'Node.js LTS'
Install-WingetPackage -Id 'Microsoft.OpenJDK.21' -Name 'Microsoft OpenJDK 21'
Install-WingetPackage -Id 'Microsoft.VisualStudioCode' -Name 'Visual Studio Code'

if (-not $SkipAndroidStudio) {
  Install-WingetPackage -Id 'Google.AndroidStudio' -Name 'Android Studio'
} else {
  Write-Warn "Pulando Android Studio"
}

Install-WslUbuntu

Write-Step "Atualizando npm"
if (Test-Command npm) {
  npm install -g npm
} else {
  Write-Warn "npm ainda nao esta no PATH desta sessao. Feche e abra o PowerShell apos instalar Node."
}

Install-NpmGlobal -PackageName '@anthropic-ai/claude-code'
Install-NpmGlobal -PackageName '@openai/codex'
Install-NpmGlobal -PackageName '@google/gemini-cli'
Install-NpmGlobal -PackageName '@capacitor/cli'

Restore-AgentSkills
Restore-Project

Write-Step "Verificacoes finais"
foreach ($cmd in @('git', 'node', 'npm', 'claude', 'codex', 'gemini', 'wsl')) {
  if (Test-Command $cmd) {
    Write-Ok "$cmd encontrado"
  } else {
    Write-Warn "$cmd nao encontrado no PATH atual"
  }
}

Show-NextSteps
