"""
Script de inicialização para estrutura de pastas no Google Drive
"""

import os
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google_drive_structure import GoogleDriveStructure
from seguranca_app import verificar_seguranca_completa
from utils import setup_creds, exibir_estrutura_pastas, carregar_config


def autenticar_google_drive():
    """
    Realiza a autenticação com o Google Drive API
    """
    SCOPES = [
        'https://www.googleapis.com/auth/drive.file',  # Acessar arquivos criados pelo app
        'https://www.googleapis.com/auth/drive.appdata'  # Acessar dados do app
    ]

    creds = None

    # O token.pickle armazena os tokens de acesso e atualização
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    # Se não houver credenciais válidas, solicite ao usuário
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # Salva as credenciais para a próxima execução
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return creds


def verificar_e_criar_estrutura_pastas():
    """
    Verifica se a estrutura de pastas existe e cria se necessário
    """
    creds = autenticar_google_drive()
    drive_structure = GoogleDriveStructure(creds)

    # Verificar se a pasta raiz já existe
    root_folder_id = None

    # Procurar pela pasta "Pintor-Plus"
    service = build('drive', 'v3', credentials=creds)
    query = "name='Pintor-Plus' and mimeType='application/vnd.google-apps.folder' and trashed=false"

    results = service.files().list(q=query, fields="files(id, name)").execute()
    items = results.get('files', [])

    if items:
        print(f"Pasta raiz 'Pintor-Plus' já existe com ID: {items[0]['id']}")
        root_folder_id = items[0]['id']
        drive_structure.root_folder_id = root_folder_id
    else:
        print("Criando estrutura de pastas...")
        root_folder_id = drive_structure.criar_estrutura_pastas()
        print(f"Estrutura de pastas criada com sucesso. ID da pasta raiz: {root_folder_id}")

    return drive_structure


def migrar_dados_antigos_if_needed(drive_structure):
    """
    Verifica se há dados antigos para migrar e realiza a migração
    """
    print("Verificando necessidade de migração de dados antigos...")

    # Aqui você pode implementar a lógica para detectar se é uma conta antiga
    # Por exemplo, verificando se há arquivos soltos no Drive ou em outras pastas

    # Se for detectado que é uma conta antiga, realizar a migração
    # drive_structure.migrar_dados_antigos()


def main():
    """
    Função principal de inicialização
    """
    print("Inicializando estrutura de pastas no Google Drive para Pintor Plus...")

    # Verificar configuração de credenciais
    if not setup_creds():
        print("❌ Configuração de credenciais incompleta. Encerrando.")
        return

    # Exibir estrutura de pastas
    exibir_estrutura_pastas()

    # Verificar e criar estrutura de pastas
    drive_structure = verificar_e_criar_estrutura_pastas()

    # Migrar dados antigos se necessário
    migrar_dados_antigos_if_needed(drive_structure)

    # Verificar segurança do app
    print("\nVerificando segurança do app...")
    creds = autenticar_google_drive()
    verificar_seguranca_completa(creds)

    print("\n✅ Inicialização concluída com sucesso!")


if __name__ == "__main__":
    main()