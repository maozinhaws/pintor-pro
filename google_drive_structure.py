"""
Implementação da estrutura de pastas no Google Drive para o aplicativo Pintor Plus
"""

import os
from typing import Dict, List, Optional
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError


class GoogleDriveStructure:
    def __init__(self, credentials: Credentials):
        """
        Inicializa o serviço do Google Drive

        Args:
            credentials: Credenciais OAuth2 para acesso ao Google Drive
        """
        self.service = build('drive', 'v3', credentials=credentials)
        self.root_folder_id = None

    def criar_estrutura_pastas(self) -> str:
        """
        Cria a estrutura completa de pastas no Google Drive

        Returns:
            ID da pasta raiz "Pintor-Plus"
        """
        # Criar pasta raiz
        root_metadata = {
            'name': 'Pintor-Plus',
            'mimeType': 'application/vnd.google-apps.folder'
        }

        root_folder = self.service.files().create(
            body=root_metadata,
            fields='id'
        ).execute()

        self.root_folder_id = root_folder.get('id')

        # Criar subpastas
        self._criar_subpastas()

        return self.root_folder_id

    def _criar_subpastas(self):
        """Cria as subpastas dentro da pasta raiz"""
        # Pasta Contatos
        contatos_folder_id = self._criar_pasta('Contatos', self.root_folder_id)
        # Pasta PDFs
        pdfs_folder_id = self._criar_pasta('PDFs', self.root_folder_id)
        # Subpastas de PDFs
        self._criar_pasta('Recibos', pdfs_folder_id)
        self._criar_pasta('Orçamentos', pdfs_folder_id)

        # Pasta Imagens
        imagens_folder_id = self._criar_pasta('Imagens', self.root_folder_id)
        # Subpastas de Imagens
        self._criar_pasta('Itens', imagens_folder_id)
        self._criar_pasta('Assinaturas', imagens_folder_id)
        self._criar_pasta('Logotipo', imagens_folder_id)

        # Outras pastas
        self._criar_pasta('Planilhas', self.root_folder_id)
        self._criar_pasta('Backup', self.root_folder_id)

    def _criar_pasta(self, nome: str, parent_id: str) -> str:
        """
        Cria uma pasta dentro de uma pasta pai

        Args:
            nome: Nome da pasta a ser criada
            parent_id: ID da pasta pai

        Returns:
            ID da pasta recém-criada
        """
        folder_metadata = {
            'name': nome,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent_id]
        }

        folder = self.service.files().create(
            body=folder_metadata,
            fields='id'
        ).execute()

        return folder.get('id')

    def migrar_dados_antigos(self):
        """Migra dados de usuários antigos para a nova estrutura de pastas"""
        # Buscar orçamentos antigos
        orcamentos_antigos = self.buscar_arquivos_tipo("orcamento", ".pdf")

        # Mover orçamentos para nova pasta
        orcamentos_folder_id = self._obter_id_pasta_por_nome('Orçamentos')
        for orcamento in orcamentos_antigos:
            self.mover_arquivo_para_pasta(orcamento['id'], orcamentos_folder_id)

        # Buscar imagens antigas
        imagens_antigas = self.buscar_imagens_usuario()

        # Classificar e mover imagens
        assinaturas_folder_id = self._obter_id_pasta_por_nome('Assinaturas')
        logotipo_folder_id = self._obter_id_pasta_por_nome('Logotipo')
        itens_folder_id = self._obter_id_pasta_por_nome('Itens')

        for imagem in imagens_antigas:
            if self.eh_assinatura(imagem):
                self.mover_arquivo_para_pasta(imagem['id'], assinaturas_folder_id)
            elif self.eh_logotipo(imagem):
                self.mover_arquivo_para_pasta(imagem['id'], logotipo_folder_id)
            else:
                self.mover_arquivo_para_pasta(imagem['id'], itens_folder_id)

    def _obter_id_pasta_por_nome(self, nome_pasta: str) -> str:
        """
        Obtém o ID de uma pasta pelo nome

        Args:
            nome_pasta: Nome da pasta a procurar

        Returns:
            ID da pasta encontrada
        """
        query = f"name='{nome_pasta}' and mimeType='application/vnd.google-apps.folder' and parents='{self.root_folder_id}'"

        results = self.service.files().list(q=query, fields="files(id)").execute()
        items = results.get('files', [])

        if items:
            return items[0]['id']
        else:
            raise ValueError(f"Pasta '{nome_pasta}' não encontrada")

    def buscar_arquivos_tipo(self, termo_busca: str, extensao: str) -> List[Dict]:
        """
        Busca arquivos por termo e extensão

        Args:
            termo_busca: Termo para busca nos nomes dos arquivos
            extensao: Extensão do arquivo a buscar

        Returns:
            Lista de arquivos encontrados
        """
        query = f"name contains '{termo_busca}' and name ends with '{extensao}'"

        results = self.service.files().list(q=query, fields="files(id, name, parents)").execute()
        return results.get('files', [])

    def buscar_imagens_usuario(self) -> List[Dict]:
        """
        Busca todas as imagens do usuário no Google Drive

        Returns:
            Lista de arquivos de imagem encontrados
        """
        query = "mimeType contains 'image/'"

        results = self.service.files().list(q=query, fields="files(id, name, parents, mimeType)").execute()
        return results.get('files', [])

    def mover_arquivo_para_pasta(self, arquivo_id: str, destino_folder_id: str):
        """
        Move um arquivo para uma pasta específica

        Args:
            arquivo_id: ID do arquivo a ser movido
            destino_folder_id: ID da pasta de destino
        """
        # Obter pasta atual do arquivo
        file = self.service.files().get(fileId=arquivo_id, fields='parents').execute()
        prev_parents = ','.join(file.get('parents'))

        # Mover arquivo
        self.service.files().update(
            fileId=arquivo_id,
            addParents=destino_folder_id,
            removeParents=prev_parents,
            fields='id, parents'
        ).execute()

    def eh_assinatura(self, arquivo: Dict) -> bool:
        """
        Verifica se o arquivo é uma assinatura

        Args:
            arquivo: Dicionário com informações do arquivo

        Returns:
            True se for uma assinatura, False caso contrário
        """
        nome = arquivo.get('name', '').lower()
        return any(termo in nome for termo in ['assinatura', 'signature', 'sign'])

    def eh_logotipo(self, arquivo: Dict) -> bool:
        """
        Verifica se o arquivo é um logotipo

        Args:
            arquivo: Dicionário com informações do arquivo

        Returns:
            True se for um logotipo, False caso contrário
        """
        nome = arquivo.get('name', '').lower()
        return any(termo in nome for termo in ['logo', 'logotipo', 'brand'])


def verificar_seguranca_app():
    """
    Função para verificar e implementar medidas de segurança no app
    """
    print("Verificando segurança do app...")

    # Autenticação
    print("- Implementar OAuth2 com escopos mínimos")
    print("- Configurar tokens com tempo de expiração curto")

    # Autorização
    print("- Definir permissões granulares para acesso às pastas")
    print("- Limitar acesso apenas às pastas específicas do app")

    # Criptografia
    print("- Garantir criptografia TLS para dados em trânsito")
    print("- Implementar criptografia AES-256 para dados em repouso")

    # Auditoria
    print("- Ativar logs de acesso ao Google Drive")
    print("- Implementar rastreamento de modificações nos arquivos")

    # Validação de entradas
    print("- Validar todos os inputs do usuário antes de salvar no Drive")
    print("- Sanitizar nomes de arquivos para evitar injeção de caminho")

    # Gerenciamento de sessão
    print("- Implementar mecanismos seguros de gerenciamento de sessão")
    print("- Revogar tokens quando o usuário faz logout")


if __name__ == "__main__":
    print("Este módulo fornece funcionalidades para estrutura de pastas no Google Drive")
    print("Para usá-lo, você precisa de credenciais OAuth2 válidas para o Google Drive API")