from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.llms import Ollama
from langchain_classic.chains import RetrievalQA
from langchain_community.document_loaders import TextLoader
import os

LLM_NAME = "llama3"

# Load logs and embed
def build_vectorstore(log_path="logs/sample.log"):
    loader = TextLoader(log_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    split_docs = splitter.split_documents(docs)

    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    db = FAISS.from_documents(split_docs, embeddings)
    db.save_local("embeddings")
    return db

def build_vectorstore_from_all_logs(log_dir="logs"):
    all_docs = []
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    for filename in os.listdir(log_dir):
        if filename.endswith(".log"):
            filepath = os.path.join(log_dir, filename)
            loader = TextLoader(filepath)
            docs = loader.load()
            split_docs = splitter.split_documents(docs)
            all_docs.extend(split_docs)

    if not all_docs:
        raise ValueError("No .log files found to index.")

    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    db = FAISS.from_documents(all_docs, embeddings)
    db.save_local("embeddings")
    return db

def get_qa_chain():
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    db = FAISS.load_local("embeddings", embeddings, allow_dangerous_deserialization=True)

    retriever = db.as_retriever(search_kwargs={"k": 3})
    llm = Ollama(model=LLM_NAME)

    chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
    return chain


