"""
Módulo de utilidades para o sistema de estrutura de pastas no Google Drive
"""

import json
import os
from typing import Dict, Any


def carregar_config() -> Dict[str, Any]:
    """
    Carrega as configurações do arquivo config.json

    Returns:
        Dicionário com as configurações
    """
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Arquivo de configuração não encontrado: {config_path}")

    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_pasta_destino_por_tipo(arquivo_nome: str) -> str:
    """
    Determina a pasta de destino com base no tipo de arquivo

    Args:
        arquivo_nome: Nome do arquivo a ser classificado

    Returns:
        Caminho da pasta de destino
    """
    config = carregar_config()
    nome_lower = arquivo_nome.lower()

    # Verificar se é PDF de orçamento
    if arquivo_nome.endswith('.pdf'):
        if 'orcamento' in nome_lower or 'budget' in nome_lower:
            return f"{config['google_drive']['root_folder_name']}/PDFs/Orçamentos/"
        elif 'recibo' in nome_lower or 'receipt' in nome_lower:
            return f"{config['google_drive']['root_folder_name']}/PDFs/Recibos/"
        else:
            return f"{config['google_drive']['root_folder_name']}/PDFs/"

    # Verificar se é imagem
    if any(ext in arquivo_nome.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']):
        if 'assinatura' in nome_lower or 'signature' in nome_lower:
            return f"{config['google_drive']['root_folder_name']}/Imagens/Assinaturas/"
        elif 'logo' in nome_lower or 'logotipo' in nome_lower:
            return f"{config['google_drive']['root_folder_name']}/Imagens/Logotipo/"
        else:
            return f"{config['google_drive']['root_folder_name']}/Imagens/Itens/"

    # Verificar se é arquivo de contato
    if any(ext in arquivo_nome.lower() for ext in ['.vcf', '.vcs']):
        return f"{config['google_drive']['root_folder_name']}/Contatos/"

    # Pasta padrão
    return config['google_drive']['root_folder_name']


def validar_credenciais_disponiveis() -> bool:
    """
    Verifica se as credenciais do Google estão disponíveis

    Returns:
        True se as credenciais estiverem disponíveis, False caso contrário
    """
    return os.path.exists('credentials.json')


def validar_token_disponivel() -> bool:
    """
    Verifica se o token de acesso está disponível

    Returns:
        True se o token estiver disponível, False caso contrário
    """
    return os.path.exists('token.pickle')


def setup_creds():
    """
    Verifica e orienta sobre a configuração das credenciais
    """
    print("Verificando configuração de credenciais...")

    if not validar_credenciais_disponiveis():
        print("⚠️  Arquivo 'credentials.json' não encontrado!")
        print("   Para configurar:")
        print("   1. Acesse https://console.cloud.google.com/")
        print("   2. Crie um novo projeto ou selecione um existente")
        print("   3. Habilite a API do Google Drive")
        print("   4. Crie credenciais OAuth2 para 'Aplicativo de Área de Trabalho'")
        print("   5. Baixe o arquivo JSON e renomeie para 'credentials.json'")
        print("   6. Coloque o arquivo na pasta raiz do projeto")
        return False

    print("✅ Credenciais encontradas.")
    return True


def exibir_estrutura_pastas():
    """
    Exibe a estrutura de pastas que será criada
    """
    config = carregar_config()
    root = config['google_drive']['root_folder_name']

    print(f"\n📁 Estrutura de pastas a ser criada no Google Drive:")
    print(f"└── {root}/")
    print("    ├── Contatos/ (*.vcf, *.vcs)")
    print("    ├── PDFs/")
    print("    │   ├── Recibos/ (gerados pelo usuário)")
    print("    │   └── Orçamentos/ (PDF emitido pelo usuário)")
    print("    ├── Imagens/")
    print("    │   ├── Itens/ (fotos enviadas ou capturadas)")
    print("    │   ├── Assinaturas/ (assinatura enviada pelo usuário)")
    print("    │   └── Logotipo/ (logotipo salvo nas configurações da empresa)")
    print("    ├── Planilhas/ (histórico de orçamentos e modificações)")
    print("    └── Backup/ (cópias após exportação do backup)")


def migrar_dados_antigos_manual():
    """
    Função para migração manual de dados antigos
    """
    print("\n🔄 Iniciando migração de dados antigos...")
    print("Esta função deve ser chamada após a criação da estrutura de pastas.")
    print("A lógica de detecção e movimentação de arquivos antigos será implementada aqui.")
    # Esta função seria implementada com base na lógica específica de detecção
    # de arquivos antigos do sistema legado