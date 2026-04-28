"""
Script de demonstração para testar os recursos de estrutura de pastas no Google Drive
"""

from utils import get_pasta_destino_por_tipo, carregar_config
from google_drive_structure import GoogleDriveStructure
from seguranca_app import SegurancaApp


def demonstrar_classificacao_pastas():
    """
    Demonstra como os arquivos são classificados nas pastas corretas
    """
    print("📂 Demonstração de classificação de pastas:")

    exemplos_arquivos = [
        "orcamento_cliente_a.pdf",
        "recibo_pagamento.png",
        "assinatura_cliente.jpg",
        "logo_empresa.png",
        "foto_item_trabalho.jpeg",
        "contato_cliente.vcf",
        "relatorio_financeiro.pdf"
    ]

    for arquivo in exemplos_arquivos:
        pasta_destino = get_pasta_destino_por_tipo(arquivo)
        print(f"  {arquivo} → {pasta_destino}")


def demonstrar_configuracao():
    """
    Demonstra como as configurações são carregadas
    """
    print("\n⚙️  Demonstração de configuração:")
    config = carregar_config()

    root_folder = config['google_drive']['root_folder_name']
    print(f"  Pasta raiz: {root_folder}")

    print("  Estrutura de pastas:")
    for pasta, conteudo in config['google_drive']['folder_structure'].items():
        print(f"    - {pasta}: {conteudo}")


def main():
    """
    Função principal de demonstração
    """
    print("🧪 Demonstração de recursos - Estrutura de Pastas no Google Drive")
    print("=" * 60)

    demonstrar_configuracao()
    demonstrar_classificacao_pastas()

    print("\nℹ️  Notas:")
    print("  - Este é um script de demonstração")
    print("  - Para execução real, use 'python iniciar_estrutura_drive.py'")
    print("  - As funções reais requerem credenciais válidas do Google Drive")


if __name__ == "__main__":
    main()