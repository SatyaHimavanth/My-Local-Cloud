from flask import Flask, render_template, send_file, url_for, abort, send_from_directory, request, redirect, jsonify
import os
import socket
import sys
import uuid
from send2trash import send2trash

def get_working_directory():
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.getcwd()

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip_address = s.getsockname()[0]
        s.close()
    except Exception as e:
        ip_address = 'Unable to get IP address'
        print(f"Error: {e}")
    return ip_address

app = Flask(__name__)

base_directory = os.path.join(get_working_directory(), 'cloud') # your hosting dir

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html', items=get_items(base_directory))

@app.route('/admin', methods=['GET'])
def admin():
    return render_template('admin.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = os.environ['ADMIN']
    password = os.environ['PASSWORD']
    if username == USER_DATA['username'] and password == USER_DATA['password']:
        session_code = str(uuid.uuid4())
        return jsonify({"success": True, "session_code": session_code}), 200
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/<path:path>', methods=['GET'])
def show_directory(path):
    directory_path = os.path.join(base_directory, path)
    if os.path.isdir(directory_path):
        return render_template('index.html', items=get_items(directory_path))
    
    elif os.path.isfile(directory_path):
        return render_file(directory_path, path)
    
    else:
        return f'Error: {path} not found', 404

@app.route('/download/<path:subpath>', methods=['GET'])
def download_file(subpath):
    subpath = subpath.replace("%5C", "/")
    subpath = subpath.replace("%20", " ")
    file_path = os.path.normpath(os.path.join(base_directory, subpath))
    if os.path.isfile(file_path):
        return send_from_directory(base_directory, subpath, as_attachment=True)
    else:
        return f'Error: File {file_path} not found', 404
    
@app.route('/delete/<path:subpath>', methods=['GET'])
def delete_file(subpath):
    subpath = subpath.replace("%5C", "/")
    subpath = subpath.replace("%20", " ")
    file_path = os.path.normpath(os.path.join(base_directory, subpath))
    if os.path.isfile(file_path):
        # os.remove(file_path)
        send2trash(file_path)
        return redirect(request.referrer or '/')
    else:
        return f'Error: File {file_path} not found', 404
    
@app.route('/files/<path:filename>', methods=['GET'])
def serve_file(filename):
    file_path = os.path.join(base_directory, filename)
    return send_file(file_path)

@app.route('/upload', methods=['POST'])
def upload_file():
    password = request.form['password']
    if not isinstance(password, str):
        password = str(password)
    if password != os.environ['UPLOAD_PASSWORD']:
        return 'Error: Invalid password', 403
    
    current_path = request.form['currentPath'].strip('/')
    upload_path = os.path.join(base_directory, current_path)
    
    files = request.files.getlist('files')
    if not os.path.isdir(upload_path):
        return 'Error: Invalid upload directory', 400
    for file in files:
        if file:
            file_path = os.path.join(upload_path, file.filename)
            file.save(file_path)
    return redirect(request.form['currentPath'])

@app.route('/createFolder', methods=['POST'])
def create_folder():
    password = request.form['password']
    if not isinstance(password, str):
        password = str(password)
    if password != os.environ['CREATE_PASSWORD']:
        return 'Error: Invalid password', 403
    
    folder_name = request.form['folder'];
    reservedChars = '<>:"\\|?.*';
    reservedNames = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"]
    for char in reservedChars:
        if char in folder_name:
            return 'Error: Invalid folder name', 400
    for char in reservedNames:
        if char in folder_name:
            return 'Error: Invalid folder name', 400
    if '/' in folder_name:
        folder_name = folder_name.split('/')
        for i in range(len(folder_name)):
            folder_name[i] = folder_name[i].strip()
        folder_name = '/'.join(folder_name)
        
    current_path = request.form['currentPath'].strip('/')
    folder_path = os.path.join(base_directory, current_path)
    if not os.path.isdir(folder_path):
        return 'Error: Invalid upload directory', 400
    os.makedirs(os.path.join(folder_path, folder_name), exist_ok=True)
    
    return redirect(request.form['currentPath'])

def render_file(file_path, relative_path):
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext in ['.txt']:
        with open(file_path, 'r') as file:
            content = file.read()
        return render_template('text_file.html', content=content)
    
    elif ext in ['.jpg', '.jpeg', '.png', '.gif']:
        return render_template('image_file.html', file_path=url_for('serve_file', filename=relative_path))
    
    elif ext in ['.html', '.htm']:
        with open(file_path, 'r') as file:
            content = file.read()
        return render_template('html_file.html', content=content)
    
    elif ext in ['.mp3', '.ogg', '.aac', '.wav']:
        return render_template('audio_file.html', file_path=url_for('serve_file', filename=relative_path))
    
    elif ext in ['.mp4', '.mkv', '.mpeg', '.avi', '.webm']:
        return render_template('video_file.html', file_path=url_for('serve_file', filename=relative_path), ipaddress=get_ip_address())
    
    elif ext in ['.pdf']:
        return render_template('pdf_file.html', file_path=url_for('serve_file', filename=relative_path))
    
    elif ext in ['.doc', '.docx']:
        return render_template('doc_file.html', file_path=url_for('serve_file', filename=relative_path))
    
    elif ext in ['.xls', '.xlsx']:
        return render_template('excel_file.html', file_path=url_for('serve_file', filename=relative_path))
    
    elif ext in ['.ppt', '.pptx']:
        return render_template('ppt_file.html', file_path=url_for('serve_file', filename=relative_path))
    
    else:
        return send_file(file_path)
        # abort(415, description=f'Unsupported file type: {ext}')

def get_items(directory):
    items = []
    for item in os.listdir(directory):
        item_path = os.path.join(directory, item)
        if os.path.isdir(item_path):
            items.append((item, url_for('show_directory', path=os.path.relpath(item_path, base_directory)), False))
        elif os.path.isfile(item_path):
            items.append((item, url_for('show_directory', path=os.path.relpath(item_path, base_directory)), True))
    return items

if __name__ == '__main__':
    ip = get_ip_address()
    app.run(host=ip, port=5000, debug=True)
