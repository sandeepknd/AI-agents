from langchain.embeddings import OllamaEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.document_loaders import TextLoader
import os

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

def get_qa_chain():
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    db = FAISS.load_local("embeddings", embeddings, allow_dangerous_deserialization=True)

    retriever = db.as_retriever(search_kwargs={"k": 3})
    llm = Ollama(model="llama3")

    chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
    return chain


