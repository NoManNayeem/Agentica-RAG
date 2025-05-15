import os
import logging
from django.conf import settings
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA

logger = logging.getLogger(__name__)

# Constants
PUBLIC_DB_PATH = os.path.join(settings.BASE_DIR, "public_chroma_db")
COLLECTION_NAME = "example_collection"

# Embedding function and vector store
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
public_vector_store = Chroma(
    collection_name=COLLECTION_NAME,
    embedding_function=embeddings,
    persist_directory=PUBLIC_DB_PATH,
)

# Retriever
public_retriever = public_vector_store.as_retriever(search_kwargs={"k": 3})

# LLM
chat_model = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

# QA Chain
public_qa_chain = RetrievalQA.from_chain_type(
    llm=chat_model,
    chain_type="stuff",
    retriever=public_retriever,
    return_source_documents=True,
)


def public_ask(question: str) -> dict:
    """
    Run RetrievalQA chain on a public question using the public vector DB.

    Args:
        question (str): User input query.

    Returns:
        dict: {
            'result': answer string,
            'source_documents': list of Document
        }
    """
    try:
        return public_qa_chain.invoke({"query": question})
    except Exception as e:
        logger.exception(f"Error in public chat retrieval for question: {question}")
        return {
            "result": "Sorry, something went wrong while answering your question.",
            "source_documents": []
        }
