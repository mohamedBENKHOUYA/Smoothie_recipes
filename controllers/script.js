const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { userInfo } = require('os');
const { PassThrough } = require('stream');


module.exports.manageMultiPartBuffer =  function manageMultiPartBuffer(req) {
        let buffer;
        let chunks = [];
        req.on('data', (chunk) => {
            chunks.push(chunk);
        });
        return new Promise(function(res, rej) {
            req.on('end', () => {
                console.log('process begins...');
                buffer = Buffer.concat(chunks);
            // })
            const contentType = req.get('Content-Type');
            
            const index = contentType.indexOf('=--') + 1;
            const boundary = '--' + contentType.slice(index);
            let blocks = {};
            let fileNames = [];
            for (let i= 0; i <= buffer.length; i++ ) {
                
                const extractedBoundary = buffer.slice(i, i + boundary.length).toString('utf-8');
                if(extractedBoundary === boundary) {
                        const currentEdge = i;
                        const nextEdge = buffer.indexOf(boundary, currentEdge + 1, 'utf-8');
                        if(nextEdge === -1) break;
                        const currentChunk = buffer.slice(currentEdge, nextEdge);
                        if(buffer.indexOf(boundary, nextEdge + 1, 'utf-8')===-1) {
                        const currentChunkTrimmed = currentChunk.slice(currentChunk.indexOf('\r\n\r\n', 0, 'utf-8'))
                        // console.log(currentChunkTrimmed.slice(4, 200).toString('utf-8'));
                        }
                        const currentChunkTrimmed = currentChunk.slice(currentChunk.indexOf('\r\n\r\n', 0, 'utf-8')).slice(4)
                        const nameIndexStart = buffer.indexOf('name=', i, 'utf-8');
                        const contentTypeStart = buffer.indexOf('Content-Type:', i, 'utf-8');
                        const fileExtensionStart = currentChunk.indexOf('filename=', 0, 'utf-8');
                        let fileExtensionEnd;
                        let fileExtension;
                        if(fileExtensionStart !== -1) {
                            fileExtensionEnd = currentChunk.indexOf(`"`, fileExtensionStart+'filename='.length + 1, 'utf-8');
                            fileExtension = currentChunk.slice(fileExtensionStart + 'filename='.length + 1, fileExtensionEnd).toString('utf-8');
                        }
                        
                        const nameIndexEnd = buffer.indexOf(`"`, nameIndexStart + 6, 'utf-8');
                        let fileName;
                        fileExtension?
                             fileName = Math.random() + buffer.slice(nameIndexStart+6, nameIndexEnd).toString('utf-8'):
                             fileName = buffer.slice(nameIndexStart+6, nameIndexEnd).toString('utf-8');
                        fileNames.push(fileName);
                        blocks[fileName] = {
                            boundaryIndexStart: i,
                            nameIndexStart,
                            nameIndexEnd,
                            fileName,
                            fileExtension,
                            content: currentChunkTrimmed,
                        };
                    }
            }
    
            const data = {};
    
            fileNames.forEach(async (fileName) => {
                const fileExtension = blocks[fileName].fileExtension;
                if(!fileExtension) {
                    data[fileName] = blocks[fileName].content.toString().trim();
                }
                
            });
    
             res({ 
                fileNames,
                blocks,
                data,
    
             })
    
            })
        })
}


module.exports.saveFiles = function saveFiles(fileNames, blocks) {
fileNames.forEach(async (fileName) => {
    const fileExtension = blocks[fileName].fileExtension;
    if(fileExtension) {
        await fs.writeFile('uploads/'+fileExtension,
        blocks[fileName].content
        , {}, function(err) {console.log(err)})
    }
});
}


module.exports.readFileBuffers = function readFileBuffers(files) {
    const filePromises = [];
    const filesNames = Object.keys(files);
    if(filesNames.length) {
        filesNames.forEach((fileName) => {
            for(let file of files[fileName]) {
                filePromises.push(new Promise((res, rej) => {
                    fs.readFile(file.path, (err, buffer) => {
                        res({fileName: file.originalname, buffer});
                    })
                }))
            }
        })
    }

    return Promise.all(filePromises);
}



module.exports.generateToken = (payload, secret) => {
    if(!payload || !secret) throw new Error('payload & secret are mandatory');
    return jwt.sign(payload, secret, {});
}

module.exports.verifyTokenRedirect = (token, res, redirectSuccess, redirectError) => {
    try {
        
        const newToken = verifyToken(token, process.env.SECRET);
        res.setHeader('Set-Cookie', `token=${newToken}; secure; HttpOnly;`);
        if(redirectSuccess) {
            res.setHeader('Location', redirectSuccess);
            res.status(303);
        }
    }
    catch(e) {
        if(!redirectSuccess) {
            res.setHeader('Location', '/'+redirectError);
            res.status(303);
        }
        if(e instanceof TypeError) throw e;
        throw new RedirectionError();
        
    }
}


module.exports.verifyEntity = async (email, password) => {
        const entity = await User.findOne({email});
        if(!entity) throw new EmailError();
        const isAuth =  await bcrypt.compare(password, entity.password);
        if(!isAuth) throw new PasswordError();
        return entity;
}


// utils
function verifyToken(token, secret) {
    if(!token) throw new Error('token does not exist');

    const payload = jwt.verify(token, secret);
    return jwt.sign({id: payload.id}, secret);
}

class EmailError extends Error {message = 'email is incorrect'}
class PasswordError  extends Error { message = 'password is incorrect' }
class RedirectionError  extends Error { message = 'Redirection is needed' };

module.exports.EmailError = EmailError;
module.exports.PasswordError = PasswordError;
module.exports.RedirectionError = RedirectionError;

