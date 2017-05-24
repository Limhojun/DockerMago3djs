'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Renderer
 */
var Renderer = function() {
	if(!(this instanceof Renderer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vbo_vi_cacheKey_aux;
	this.byteColorAux = new ByteColor();

	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***

	this.currentTimeSC;
	this.dateSC;
	this.startTimeSC;
	this.simpObj_scratch;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefLists = function(gl, neoRefList_array, neoBuilding, magoManager, isInterior, standardShader, renderTexture, ssao_idx) {
	// render_neoRef
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;

	//this.dateSC = new Date();
	//this.startTimeSC = this.dateSC.getTime();
	//this.currentTimeSC;
	//var secondsUsed;

	var timeControlCounter = 0;

	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
//	if(MagoConfig.getInformation().renderingConfg.cullFaceEnable) {
//		gl.enable(gl.CULL_FACE);
//	} else {
//		gl.disable(gl.CULL_FACE);
//	}

	gl.enable(gl.CULL_FACE);

	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	var cacheKeys_count;
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;

	gl.activeTexture(gl.TEXTURE2); // necessary.***
	if(renderTexture) {
		if(ssao_idx == 1)
			gl.uniform1i(standardShader.hasTexture_loc, true); //.***
	} else{
		gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
	}

	var geometryDataPath = magoManager.readerWriter.geometryDataPath;

	for(var j=0; j<neoRefLists_count; j++) {
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList_array[j].blocksList;

		//var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		if(myBlocksList == undefined) continue;

		if(myBlocksList.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
			myBlocksList.parseArrayBuffer(gl, myBlocksList.dataArraybuffer, magoManager.readerWriter);
			myBlocksList.dataArraybuffer = undefined;
			continue;
		}

		if(myBlocksList.fileLoadState != CODE.fileLoadState.PARSE_FINISHED) continue;

		//if(!isInterior && neoRefList.name == "Ref_Bone")
		//	continue;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		if(magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
		{
			/*
			if(neoRefList._lodLevel == 1 || neoRefList._lodLevel == 2)
			{
				continue;
			}

			this.dateSC = new Date();
			this.currentTimeSC = this.dateSC.getTime();
			secondsUsed = this.currentTimeSC - this.startTimeSC;
			if(secondsUsed > 60)
			{
				//gl.disableVertexAttribArray(standardShader.normal3_loc);
				//gl.disableVertexAttribArray(standardShader.position3_loc);
				//gl.disableVertexAttribArray(standardShader.texCoord2_loc);
				return;
			}
			*/
		}

		for(var k=0; k<visibleIndices_count; k++) {
			//if(magoManager.isCameraMoving && isInterior && timeControlCounter == 0)
//			if(magoManager.isCameraMoving && timeControlCounter == 0) {
//				//if(j==4)return;
//
//				//this.dateSC = new Date();
//				//this.currentTimeSC = this.dateSC.getTime();
//				//secondsUsed = this.currentTimeSC - this.startTimeSC;
//				//if(secondsUsed > 600) // miliseconds.***
//				{
//					//gl.disableVertexAttribArray(standardShader.normal3_loc);
//					//gl.disableVertexAttribArray(standardShader.position3_loc);
//					//gl.disableVertexAttribArray(standardShader.texCoord2_loc);
//					//return;
//				}
//			}
			//var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined) {
				continue;
			}

			block_idx = neoReference._block_idx;

			if(block_idx >= myBlocksList.blocksArray.length) {
				continue;
			}
			block = myBlocksList.getBlock(block_idx);

			if(magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
			{
				if(block != null) {
					if(block.isSmallObj && magoManager.objectSelected != neoReference) continue;
				}
			}

			// Check if the texture is loaded.********************************************************************************
			if(neoReference.texture != undefined && neoReference.texture.texId == undefined) {
				if(magoManager.backGround_fileReadings_count > 10) continue;

				// 1rst, check if the texture is loaded.***
				var texId = neoBuilding.getTextureId(neoReference.texture);
				if(texId == undefined) {
					// Load the texture.***
					var filePath_inServer = geometryDataPath + "/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.textureImageFileName;
					magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, neoReference.texture, neoBuilding, magoManager);
					magoManager.backGround_fileReadings_count ++;
					continue;
				} else {
					neoReference.texture.texId = texId;
				}
			}

			if(magoManager.objectSelected == neoReference) {
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***
				gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
			} else {
				//if(neoReference.texture != undefined && renderTexture)
				if(renderTexture) {
					if(neoReference.hasTexture) {
						if(neoReference.texture != undefined) {
							if(neoReference.texture.texId != undefined) {
								gl.uniform1i(standardShader.hasTexture_loc, true); //.***
								if(current_tex_id != neoReference.texture.texId) {
									//gl.activeTexture(gl.TEXTURE2);
									gl.bindTexture(gl.TEXTURE_2D, neoReference.texture.texId);
									current_tex_id = neoReference.texture.texId;
								}
							} else {
								continue;
							}
						} else {
							continue;
						}
					} else {
						// if there are no texture, then use a color.***
						if(ssao_idx == 1) {
							if(!neoReference.hasTexture) {
								if(neoReference.color4) {
									//if(neoReference.color4.a < 60)
									//	continue;

									gl.uniform1i(standardShader.hasTexture_loc, false); //.***
									gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
								}
							}
						}
					}
				} else {
					// if there are no texture, then use a color.***
					if(ssao_idx == 1)// real render.***
					{
						if(!neoReference.hasTexture) {
							if(neoReference.color4) {
								//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
								//	continue;

								gl.uniform1i(standardShader.hasTexture_loc, false); //.***
								gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
							}
						}
					} else if(ssao_idx == 0) // depth render.***
					{
						if(neoReference.color4) {
							//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
							//	continue;
						}
					}
				}
			}

			// End checking textures loaded.------------------------------------------------------------------------------------

			// ifc_space = 27, ifc_window = 26, ifc_plate = 14
			if(block != null) {
				//ifc_entity = block.mIFCEntityType;
				//if( ifc_entity==26 || ifc_entity==27 || ifc_entity==14)
				//	continue;

				//if(magoManager.isCameraMoving && block.isSmallObj)
				//	continue;

				cacheKeys_count = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
				// Must applicate the transformMatrix of the reference object.***

				gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);

				if(neoReference.moveVector != undefined) {
					gl.uniform1i(standardShader.hasAditionalMov_loc, true);
					gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***
				} else {
					gl.uniform1i(standardShader.hasAditionalMov_loc, false);
					gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
				}

				for(var n=0; n<cacheKeys_count; n++) // Original.***
				{
					//var mesh_array = block.viArraysContainer._meshArrays[n];
					this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];

					//****************************************************************************************************AAA
					if(this.vbo_vi_cacheKey_aux.meshVertexCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.posVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshVertexCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.posVboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.posVboDataArray = undefined;
						//this.vbo_vi_cacheKey_aux.posVboDataArray = null;
						continue;
					}

					if(this.vbo_vi_cacheKey_aux.meshNormalCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.norVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshNormalCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshNormalCacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.norVboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.norVboDataArray = undefined;
						//this.vbo_vi_cacheKey_aux.norVboDataArray = null;
						continue;
					}

					if(this.vbo_vi_cacheKey_aux.meshFacesCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.idxVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshFacesCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idxVboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.idxVboDataArray = undefined;
						//this.vbo_vi_cacheKey_aux.idxVboDataArray = null;
						continue;
					}

					//if(this.vbo_vi_cacheKey_aux.meshVertexCacheKey == undefined || this.vbo_vi_cacheKey_aux.meshNormalCacheKey == undefined || this.vbo_vi_cacheKey_aux.meshFacesCacheKey == undefined)
					//	continue;

					// Positions.***

					gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
					gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false,0,0);

					// Normals.***
					if(standardShader.normal3_loc != -1) {
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshNormalCacheKey);
						gl.vertexAttribPointer(standardShader.normal3_loc, 3, gl.BYTE, true,0,0);
					}

					if(renderTexture && neoReference.hasTexture) {
						if(block.vertexCount <= neoReference.vertexCount) {
							gl.enableVertexAttribArray(standardShader.texCoord2_loc);
							gl.bindBuffer(gl.ARRAY_BUFFER, neoReference.MESH_TEXCOORD_cacheKey);
							gl.vertexAttribPointer(standardShader.texCoord2_loc, 2, gl.FLOAT, false,0,0);
						} 	else{
							if(standardShader.texCoord2_loc != -1) gl.disableVertexAttribArray(standardShader.texCoord2_loc);
						}
					} else {
						if(standardShader.texCoord2_loc != -1) gl.disableVertexAttribArray(standardShader.texCoord2_loc);
					}

					// Indices.***
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
					gl.drawElements(gl.TRIANGLES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
					//gl.drawElements(gl.LINES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***
				}
			}
			//timeControlCounter++;
			//if(timeControlCounter > 20)
			//	timeControlCounter = 0;
		}
	}
	gl.enable(gl.DEPTH_TEST);
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefListsAsimetricVersion = function(gl, neoReferencesMotherAndIndices, neoBuilding, magoManager,
		isInterior, standardShader, renderTexture, ssao_idx, maxSizeToRender, lod, refMatrixIdxKey) {
	// render_neoRef
	var neoRefsCount = neoReferencesMotherAndIndices.neoRefsIndices.length;
	if(neoRefsCount == 0) return;

	//this.dateSC = new Date();
	//this.startTimeSC = this.dateSC.getTime();
	//this.currentTimeSC;
	//var secondsUsed;

	var timeControlCounter = 0;

	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	if(MagoConfig.getInformation().renderingConfg.cullFaceEnable) {
		gl.enable(gl.CULL_FACE);
	} else {
		gl.disable(gl.CULL_FACE);
	}

	gl.enable(gl.CULL_FACE);
	//gl.disable(gl.CULL_FACE);

	gl.frontFace(gl.CCW);

	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	var cacheKeys_count;
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;

	gl.activeTexture(gl.TEXTURE2); // necessary.***
	if(renderTexture) {
		if(ssao_idx == 1) gl.uniform1i(standardShader.hasTexture_loc, true); //.***
	} else {
		gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
	}

	var geometryDataPath = magoManager.readerWriter.geometryDataPath;

	for(var j=0; j<1; j++) {
		var myBlocksList = neoReferencesMotherAndIndices.blocksList;
		if(myBlocksList == undefined)
			continue;

		if(myBlocksList.fileLoadState == CODE.fileLoadState.LOADING_FINISHED && !magoManager.isCameraMoving)
		{
			if(neoBuilding.buildingType == "basicBuilding")
			{
				var hola = 0;
			}
			myBlocksList.parseArrayBufferAsimetricVersion(gl, myBlocksList.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherBlocksArray);
			myBlocksList.dataArraybuffer = undefined;
			continue;
		}

		if(myBlocksList.fileLoadState != CODE.fileLoadState.PARSE_FINISHED) continue;

		//if(neoBuilding.buildingType == "basicBuilding")
		//{
		//	var hola = 0;
		//	if(ssao_idx == 1)
		//		hola = 0;
		//}
			
		// New version. Use occlussion indices.***
		//var visibleIndices_count = neoReferencesMotherAndIndices.neoRefsIndices.length; // no occludeCulling mode.***
		var visibleIndices_count = neoReferencesMotherAndIndices.currentVisibleIndices.length;

		for(var k=0; k<visibleIndices_count; k++) {
			//var neoReference = neoReferencesMotherAndIndices.motherNeoRefsList[neoReferencesMotherAndIndices.neoRefsIndices[k]]; // no occludeCulling mode.***
			var neoReference = neoReferencesMotherAndIndices.motherNeoRefsList[neoReferencesMotherAndIndices.currentVisibleIndices[k]];
			if(!neoReference || neoReference == undefined) {
				continue;
			}

			if(neoReference.bRendered)
				continue;

			block_idx = neoReference._block_idx;
			block = neoBuilding.motherBlocksArray[block_idx];

			if(block == undefined)
				continue;

			if(maxSizeToRender && block != null) {
				if(block.radius < maxSizeToRender) continue;
			}

			if(magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
			{
				if(block != null) {
					if(block.isSmallObj && magoManager.objectSelected != neoReference) continue;
				}
			}

			// Check if the texture is loaded.********************************************************************************
			if(neoReference.texture != undefined){
				if(neoReference.texture.texId == undefined) {
					if(magoManager.backGround_fileReadings_count > 10) continue;

					// 1rst, check if the texture is loaded.***
					var texId = neoBuilding.getTextureId(neoReference.texture);
					if(texId == undefined) {
						// Load the texture.***
						var filePath_inServer = geometryDataPath + "/" +neoBuilding.buildingFileName+"/Images_Resized/"+neoReference.texture.textureImageFileName;
						magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, neoReference.texture, neoBuilding, magoManager);
						magoManager.backGround_fileReadings_count ++;
						continue;
					} else {
						neoReference.texture.texId = texId;
					}
				}
			}
			// End checking textures loaded.------------------------------------------------------------------------------------
			
			if(neoBuilding.isHighLighted)
			{
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***
				gl.uniform4fv(standardShader.color4Aux_loc, magoManager.highLightColor4);
			}
			else if(neoBuilding.isColorChanged)
			{
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***
				if(magoManager.objectSelected == neoReference) {
					gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
				}
				else{
					gl.uniform4fv(standardShader.color4Aux_loc, [neoBuilding.aditionalColor.r, neoBuilding.aditionalColor.g ,neoBuilding.aditionalColor.b ,neoBuilding.aditionalColor.a] );
				}
			}
			else if(neoReference.aditionalColor)
			{
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***
				if(magoManager.objectSelected == neoReference) {
					gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
				}
				else{
					gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.aditionalColor.r, neoReference.aditionalColor.g ,neoReference.aditionalColor.b ,neoReference.aditionalColor.a] );
				}
			}
			else
			{
				if(magoManager.objectSelected == neoReference) {
					gl.uniform1i(standardShader.hasTexture_loc, false); //.***
					gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
				}
				else if(magoManager.magoPolicy.colorChangedObjectId == neoReference.objectId)
				{
					gl.uniform1i(standardShader.hasTexture_loc, false); //.***
					gl.uniform4fv(standardShader.color4Aux_loc, [magoManager.magoPolicy.color[0],magoManager.magoPolicy.color[1],magoManager.magoPolicy.color[2], 1.0]);
				}
				else
				{
					//if(neoReference.texture != undefined && renderTexture)
					if(renderTexture) {
						if(neoReference.hasTexture) {
							if(neoReference.texture != undefined) {
								if(neoReference.texture.texId != undefined) {
									gl.uniform1i(standardShader.hasTexture_loc, true); //.***
									if(current_tex_id != neoReference.texture.texId) {
										//gl.activeTexture(gl.TEXTURE2);
										gl.bindTexture(gl.TEXTURE_2D, neoReference.texture.texId);
										current_tex_id = neoReference.texture.texId;
									}
								} else {
									continue;
								}
							} else {
								continue;
							}
						} else {
							// if there are no texture, then use a color.***
							if(ssao_idx == 1) {
								if(!neoReference.hasTexture) {
									if(neoReference.color4) {
										gl.uniform1i(standardShader.hasTexture_loc, false); //.***
										gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
									}
								}
							}
						}
					} else {
						// if there are no texture, then use a color.***
						if(ssao_idx == 1)// real render.***
						{
							if(!neoReference.hasTexture) {
								if(neoReference.color4) {
									//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
									//	continue;

									gl.uniform1i(standardShader.hasTexture_loc, false); //.***
									gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
								}
							}
							else
							{
								gl.uniform1i(standardShader.hasTexture_loc, false); //.***
								gl.uniform4fv(standardShader.color4Aux_loc, [0.8, 0.8, 0.8, 1.0]);
							}
						}
						else if(ssao_idx == 0) // depth render.***
						{
							if(neoReference.color4) {
								//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
								//	continue;
							}
						}
						else if(ssao_idx == -1) // depth render.***
						{
							if(neoReference.selColor4) {
								//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
								gl.uniform1i(standardShader.hasTexture_loc, false); //.***
								gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.selColor4.r/255.0, neoReference.selColor4.g/255.0, neoReference.selColor4.b/255.0, 1.0]);
							}
						}
					}
				}
			}
			

			// ifc_space = 27, ifc_window = 26, ifc_plate = 14
			if(block != null) {

				//ifc_entity = block.mIFCEntityType;
				cacheKeys_count = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
				// Must applicate the transformMatrix of the reference object.***
				if(refMatrixIdxKey == undefined)
					gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
				else{
					if(refMatrixIdxKey == -1)
						gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
					else{
						if(neoReference.tMatrixAuxArray == undefined)
						{
							//neoReference.multiplyKeyTransformMatrix(refMatrixIdxKey, neoBuilding.geoLocationDataAux.rotMatrix);
							// we must collect all the neoReferences that has no tMatrixAuxArray and make it.***
							continue;
						}

						gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference.tMatrixAuxArray[refMatrixIdxKey]._floatArrays);
					}
				}

				if(neoReference.moveVector != undefined) {
					gl.uniform1i(standardShader.hasAditionalMov_loc, true);
					gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***
				} else {
					gl.uniform1i(standardShader.hasAditionalMov_loc, false);
					gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
				}

				for(var n=0; n<cacheKeys_count; n++) // Original.***
				{
					//var mesh_array = block.viArraysContainer._meshArrays[n];
					this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];

					if(this.vbo_vi_cacheKey_aux.meshVertexCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.posVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshVertexCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.posVboDataArray, gl.STATIC_DRAW);
						//this.vbo_vi_cacheKey_aux.posVboDataArray = [];
						this.vbo_vi_cacheKey_aux.posVboDataArray = null;

						continue;
					}

					if(this.vbo_vi_cacheKey_aux.meshNormalCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.norVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshNormalCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshNormalCacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.norVboDataArray, gl.STATIC_DRAW);
						//this.vbo_vi_cacheKey_aux.norVboDataArray = [];
						this.vbo_vi_cacheKey_aux.norVboDataArray = null;

						continue;
					}

					if(this.vbo_vi_cacheKey_aux.meshFacesCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.idxVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshFacesCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idxVboDataArray, gl.STATIC_DRAW);
						//this.vbo_vi_cacheKey_aux.idxVboDataArray = [];
						this.vbo_vi_cacheKey_aux.idxVboDataArray = null;

						continue;
					}

					//if(this.vbo_vi_cacheKey_aux.meshVertexCacheKey == undefined || this.vbo_vi_cacheKey_aux.meshNormalCacheKey == undefined || this.vbo_vi_cacheKey_aux.meshFacesCacheKey == undefined)
					//	continue;

					// Positions.***

					gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
					//gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false,0,0);
					gl.vertexAttribPointer(standardShader.attribLocationCacheObj["position"], 3, gl.FLOAT, false,0,0);

					// Normals.***
					if(standardShader.normal3_loc != -1) {
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshNormalCacheKey);
						gl.vertexAttribPointer(standardShader.normal3_loc, 3, gl.BYTE, true,0,0);
					}

					if(renderTexture && neoReference.hasTexture) {
						if(block.vertexCount <= neoReference.vertexCount) {
							var refVboData = neoReference.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];
							
							if(refVboData.meshTexcoordsCacheKey == undefined) {
								if(refVboData.tcoordVboDataArray == undefined) continue;

								refVboData.meshTexcoordsCacheKey = gl.createBuffer ();
								gl.bindBuffer(gl.ARRAY_BUFFER, refVboData.meshTexcoordsCacheKey);
								gl.bufferData(gl.ARRAY_BUFFER, refVboData.tcoordVboDataArray, gl.STATIC_DRAW);
								//this.vbo_vi_cacheKey_aux.tcoordVboDataArray = [];
								refVboData.tcoordVboDataArray = null;

								continue;
							}
							gl.enableVertexAttribArray(standardShader.texCoord2_loc);
							gl.bindBuffer(gl.ARRAY_BUFFER, refVboData.meshTexcoordsCacheKey);
							gl.vertexAttribPointer(standardShader.texCoord2_loc, 2, gl.FLOAT, false,0,0);
						} else {
							if(standardShader.texCoord2_loc != -1) gl.disableVertexAttribArray(standardShader.texCoord2_loc);
						}
					} else {
						if(standardShader.texCoord2_loc != -1) gl.disableVertexAttribArray(standardShader.texCoord2_loc);
					}

					// Indices.***
					var indicesCount;
					if(magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
					{
						indicesCount = this.vbo_vi_cacheKey_aux.bigTrianglesIndicesCount;
						if(indicesCount > this.vbo_vi_cacheKey_aux.indicesCount)
							indicesCount = this.vbo_vi_cacheKey_aux.indicesCount;

					}
					else
					{
						//if(lod > 0)
						//{
						//	indicesCount = this.vbo_vi_cacheKey_aux.bigTrianglesIndicesCount;
						//	if(indicesCount > this.vbo_vi_cacheKey_aux.indicesCount)
						//		indicesCount = this.vbo_vi_cacheKey_aux.indicesCount;
						//}
						//else indicesCount = this.vbo_vi_cacheKey_aux.indicesCount;
						indicesCount = this.vbo_vi_cacheKey_aux.indicesCount;
					}

					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
					//gl.drawElements(gl.TRIANGLES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
					gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
					//gl.drawElements(gl.LINES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***
				}

				neoReference.bRendered = true;
			}
			//timeControlCounter++;
			//if(timeControlCounter > 20)
			//	timeControlCounter = 0;

		}
	}

	gl.enable(gl.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefListsAsimetricVersionColorSelection = function(gl, neoReferencesMotherAndIndices, neoBuilding, magoManager, isInterior, standardShader, renderTexture, ssao_idx, maxSizeToRender, refMatrixIdxKey) {
	// render_neoRef
	var neoRefsCount = neoReferencesMotherAndIndices.neoRefsIndices.length;
	if(neoRefsCount == 0) return;

	//this.dateSC = new Date();
	//this.startTimeSC = this.dateSC.getTime();
	//this.currentTimeSC;
	//var secondsUsed;

	var timeControlCounter = 0;

	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
//	if(MagoConfig.getInformation().renderingConfg.cullFaceEnable) {
//		gl.enable(gl.CULL_FACE);
//	} else {
//		gl.disable(gl.CULL_FACE);
//	}

	//gl.enable(gl.CULL_FACE);
	gl.disable(gl.CULL_FACE);

	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	var cacheKeys_count;
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;


	var geometryDataPath = magoManager.readerWriter.geometryDataPath;

	for(var j=0; j<1; j++) {
		//var neoRefList = neoRefList_array[j];
		var myBlocksList = neoReferencesMotherAndIndices.blocksList;

		//var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		if(myBlocksList == undefined)
			continue;

		if(myBlocksList.fileLoadState == CODE.fileLoadState.LOADING_FINISHED && !magoManager.isCameraMoving)
		{
			//myBlocksList.parseArrayBufferAsimetricVersion(gl, myBlocksList.dataArraybuffer, magoManager.readerWriter, neoBuilding.motherBlocksArray);
			//myBlocksList.dataArraybuffer = undefined;
			continue;
		}

		if(myBlocksList.fileLoadState != CODE.fileLoadState.PARSE_FINISHED) continue;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoReferencesMotherAndIndices.neoRefsIndices.length;
		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************

		for(var k=0; k<visibleIndices_count; k++) {

			//var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			var neoReference = neoReferencesMotherAndIndices.motherNeoRefsList[neoReferencesMotherAndIndices.neoRefsIndices[k]];
			if(!neoReference || neoReference== undefined) {
				continue;
			}

			//if(neoReference.bRendered)
			//	continue;

			block_idx = neoReference._block_idx;

			//if(block_idx >= myBlocksList.blocksArray.length) {
			//	continue;
			//}
			//block = myBlocksList.getBlock(block_idx); // Old.***
			block = neoBuilding.motherBlocksArray[block_idx];

			if(block == undefined)
				continue;


			if(maxSizeToRender && block != null) {
				if(block.radius < maxSizeToRender) continue;
			}

			if(magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
			{
				if(block != null) {
					if(block.isSmallObj && magoManager.objectSelected != neoReference) continue;
				}
			}



			if(neoReference.selColor4) {
				//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***
				gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.selColor4.r/255.0, neoReference.selColor4.g/255.0, neoReference.selColor4.b/255.0, 1.0]);
			}


			// End checking textures loaded.------------------------------------------------------------------------------------

			// ifc_space = 27, ifc_window = 26, ifc_plate = 14
			if(block != null) {

				//ifc_entity = block.mIFCEntityType;
				cacheKeys_count = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
				// Must applicate the transformMatrix of the reference object.***

				if(refMatrixIdxKey == undefined)
					gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
				else{
					if(refMatrixIdxKey == -1)
						gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
					else{
						if(neoReference.tMatrixAuxArray == undefined)
							continue;

						gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference.tMatrixAuxArray[refMatrixIdxKey]._floatArrays);
					}
				}

				if(neoReference.moveVector != undefined) {
					gl.uniform1i(standardShader.hasAditionalMov_loc, true);
					gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***
				} else {
					gl.uniform1i(standardShader.hasAditionalMov_loc, false);
					gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
				}

				for(var n=0; n<cacheKeys_count; n++) // Original.***
				{
					//var mesh_array = block.viArraysContainer._meshArrays[n];
					this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];

					if(this.vbo_vi_cacheKey_aux.meshVertexCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.posVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshVertexCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.posVboDataArray, gl.STATIC_DRAW);
						//this.vbo_vi_cacheKey_aux.posVboDataArray = [];
						this.vbo_vi_cacheKey_aux.posVboDataArray = null;

						continue;
					}


					if(this.vbo_vi_cacheKey_aux.meshFacesCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.idxVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshFacesCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idxVboDataArray, gl.STATIC_DRAW);
						//this.vbo_vi_cacheKey_aux.idxVboDataArray = [];
						this.vbo_vi_cacheKey_aux.idxVboDataArray = null;

						continue;
					}

					//if(this.vbo_vi_cacheKey_aux.meshVertexCacheKey == undefined || this.vbo_vi_cacheKey_aux.meshNormalCacheKey == undefined || this.vbo_vi_cacheKey_aux.meshFacesCacheKey == undefined)
					//	continue;

					// Positions.***
					gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
					gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false,0,0);

					// Indices.***
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
					gl.drawElements(gl.TRIANGLES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
					//gl.drawElements(gl.LINES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***
				}

				//neoReference.bRendered = true;
			}
			//timeControlCounter++;
			//if(timeControlCounter > 20)
			//	timeControlCounter = 0;

		}
	}

	gl.enable(gl.DEPTH_TEST);
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefListsLegoAsimetricVersion = function(gl, neoRefList_array, neoBuilding, magoManager,
		isInterior, standardShader, renderTexture, ssao_idx, lod) {
	// render_neoRef
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;

	//this.dateSC = new Date();
	//this.startTimeSC = this.dateSC.getTime();
	//this.currentTimeSC;
	//var secondsUsed;

	var timeControlCounter = 0;

	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	if(MagoConfig.getInformation().renderingConfg.cullFaceEnable) {
		gl.enable(gl.CULL_FACE);
	} else {
		gl.disable(gl.CULL_FACE);
	}

	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	var cacheKeys_count;
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;

	gl.activeTexture(gl.TEXTURE2); // necessary.***
	if(renderTexture) {
		if(ssao_idx == 1)
			gl.uniform1i(standardShader.hasTexture_loc, true); //.***
	} else{
		gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
	}

	var geometryDataPath = magoManager.readerWriter.geometryDataPath;

	for(var j=0; j<neoRefLists_count; j++) {
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList.blocksList;

		//var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		if(myBlocksList == undefined) continue;

		if(myBlocksList.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
			myBlocksList.parseArrayBufferAsimetricVersion(gl, myBlocksList.dataArraybuffer, magoManager.readerWriter);
			myBlocksList.dataArraybuffer = undefined;
			continue;
		}

		if(myBlocksList.fileLoadState != CODE.fileLoadState.PARSE_FINISHED) continue;

		//if(!isInterior && neoRefList.name == "Ref_Bone")
		//	continue;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
//		if(magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
//		{
//			/*
//			if(neoRefList._lodLevel == 1 || neoRefList._lodLevel == 2)
//			{
//				continue;
//			}
//
//			this.dateSC = new Date();
//			this.currentTimeSC = this.dateSC.getTime();
//			secondsUsed = this.currentTimeSC - this.startTimeSC;
//			if(secondsUsed > 60)
//			{
//				//gl.disableVertexAttribArray(standardShader.normal3_loc);
//				//gl.disableVertexAttribArray(standardShader.position3_loc);
//				//gl.disableVertexAttribArray(standardShader.texCoord2_loc);
//				return;
//			}
//			*/
//		}

		for(var k=0; k<visibleIndices_count; k++) {
			//if(magoManager.isCameraMoving && isInterior && timeControlCounter == 0)
//			if(magoManager.isCameraMoving && timeControlCounter == 0)
//			{
//				//if(j==4)return;
//
//				//this.dateSC = new Date();
//				//this.currentTimeSC = this.dateSC.getTime();
//				//secondsUsed = this.currentTimeSC - this.startTimeSC;
//				//if(secondsUsed > 600) // miliseconds.***
//				{
//					//gl.disableVertexAttribArray(standardShader.normal3_loc);
//					//gl.disableVertexAttribArray(standardShader.position3_loc);
//					//gl.disableVertexAttribArray(standardShader.texCoord2_loc);
//					//return;
//				}
//			}
			//var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined) {
				continue;
			}

			block_idx = neoReference._block_idx;

			if(block_idx >= myBlocksList.blocksArray.length) {
				continue;
			}
			block = myBlocksList.getBlock(block_idx);

			if(block.radius < 0.3) continue;

			if(magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
			{
				if(block != null) {
					if(block.isSmallObj && magoManager.objectSelected != neoReference) continue;
				}
			}

			// Check if the texture is loaded.********************************************************************************
			if(neoReference.texture != undefined && neoReference.texture.texId == undefined) {
				if(magoManager.backGround_fileReadings_count > 10) continue;

				// 1rst, check if the texture is loaded.***
				var texId = neoBuilding.getTextureId(neoReference.texture);
				if(texId == undefined) {
					// Load the texture.***
					var filePath_inServer = geometryDataPath + "/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.textureImageFileName;
					magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, neoReference.texture, neoBuilding, magoManager);
					magoManager.backGround_fileReadings_count ++;
					continue;
				} else {
					neoReference.texture.texId = texId;
				}
			}

			if(magoManager.objectSelected == neoReference) {
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***
				gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
			} else {
				//if(neoReference.texture != undefined && renderTexture)
				if(renderTexture) {
					if(neoReference.hasTexture) {
						if(neoReference.texture != undefined) {
							if(neoReference.texture.texId != undefined) {
								gl.uniform1i(standardShader.hasTexture_loc, true); //.***
								if(current_tex_id != neoReference.texture.texId) {
									//gl.activeTexture(gl.TEXTURE2);
									gl.bindTexture(gl.TEXTURE_2D, neoReference.texture.texId);
									current_tex_id = neoReference.texture.texId;
								}
							} else {
								continue;
							}
						} else {
							continue;
						}
					} else {
						// if there are no texture, then use a color.***
//						if(ssao_idx == 1) {
//							if(!neoReference.hasTexture) {
//								if(neoReference.color4)
//								{
//									//if(neoReference.color4.a < 60)
//									//	continue;
//
//									//gl.uniform1i(standardShader.hasTexture_loc, false); //.***
//									//gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
//								}
//							}
//						}
					}
				} else {
					// if there are no texture, then use a color.***
//					if(ssao_idx == 1)// real render.***
//					{
//						if(!neoReference.hasTexture) {
//							if(neoReference.color4) {
//								//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
//								//	continue;
//
//								//gl.uniform1i(standardShader.hasTexture_loc, false); //.***
//								//gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
//							}
//						}
//					}
//					else if(ssao_idx == 0) // depth render.***
//					{
//						if(neoReference.color4)
//						{
//							//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
//							//	continue;
//
//						}
//					}
				}
			}

			// End checking textures loaded.------------------------------------------------------------------------------------

			// ifc_space = 27, ifc_window = 26, ifc_plate = 14
			if(block != null && block.lego != undefined) {
				//if(magoManager.isCameraMoving && block.isSmallObj)
				//	continue;

				//cacheKeys_count = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
				cacheKeys_count = block.lego.vbo_vicks_container.vboCacheKeysArray.length;
				// Must applicate the transformMatrix of the reference object.***

				gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);

				if(neoReference.moveVector != undefined) {
					gl.uniform1i(standardShader.hasAditionalMov_loc, true);
					gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***
				} else {
					gl.uniform1i(standardShader.hasAditionalMov_loc, false);
					gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
				}

				for(var n=0; n<cacheKeys_count; n++) // Original.***
				{
					//var mesh_array = block.viArraysContainer._meshArrays[n];
					//this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];
					this.vbo_vi_cacheKey_aux = block.lego.vbo_vicks_container.vboCacheKeysArray[n];

					// ssao_idx = -1 -> pickingMode.***
					// ssao_idx = 0 -> depth.***
					// ssao_idx = 1 -> ssao.***

					if(ssao_idx == 0) // depth.***
					{
						// 1) Position.*********************************************
						var vbo_vicky = block.lego.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
						if(vbo_vicky.meshVertexCacheKey == null) {
							if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
							{
								vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
								gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
								gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

								vbo_vicky.posVboDataArray = undefined;
							}

							continue;
						}

						var vertices_count = vbo_vicky.vertexCount;

						if(vertices_count == 0) {
							continue;
						}

						gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
						gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
						gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
					} else if(ssao_idx == 1) // ssao.***
					{
						var vbo_vicky = block.lego.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
						var vertices_count = vbo_vicky.vertexCount;

						if(vertices_count == 0) {
							continue;
						}

						// 1) Position.*********************************************
						if(vbo_vicky.meshVertexCacheKey == null) {
							if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
							{
								vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
								gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
								gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

								vbo_vicky.posVboDataArray = undefined;
							}

							continue;
						}

						// 2) Normal.*********************************************
						if(vbo_vicky.meshNormalCacheKey == null) {
							if(vbo_vicky.norVboDataArray != undefined) //dataArrayByteLength > 0
							{
								vbo_vicky.meshNormalCacheKey = gl.createBuffer ();
								gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
								gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.norVboDataArray, gl.STATIC_DRAW);

								vbo_vicky.norVboDataArray = undefined;
							}
							continue;
						}

						// 3) Color.*********************************************
						if(vbo_vicky.meshColorCacheKey == null) {
							if(vbo_vicky.colVboDataArray != undefined) //dataArrayByteLength > 0
							{
								vbo_vicky.meshColorCacheKey = gl.createBuffer ();
								gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
								gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.colVboDataArray, gl.STATIC_DRAW);

								vbo_vicky.colVboDataArray = undefined;
							}

							continue;
						}

						if(vertices_count == 0) {
							continue;
						}

						gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
						gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false, 0, 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
						gl.vertexAttribPointer(standardShader.normal3_loc, 3, gl.BYTE, true, 0, 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
						gl.vertexAttribPointer(standardShader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

						gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
					}

				}
			}
			//timeControlCounter++;
			//if(timeControlCounter > 20)
			//	timeControlCounter = 0;

		}
	}

	gl.enable(gl.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefListsColorSelection = function(gl, neoRefList_array, neoBuilding, magoManager, isInterior, standardShader, renderTexture, ssao_idx) {
	// render_neoRef
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;

	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();
	this.currentTimeSC;
	var secondsUsed;
	var timeControlCounter = 0;

	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	gl.enable(gl.CULL_FACE);
	//gl.disable(gl.CULL_FACE);

	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);

	var cacheKeys_count;
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;

	for(var j=0; j<neoRefLists_count; j++) {

		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList_array[j].blocksList;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		for(var k=0; k<visibleIndices_count; k++) {
			//if(magoManager.isCameraMoving && isInterior && timeControlCounter == 0)
//			if(magoManager.isCameraMoving && timeControlCounter == 0){
//			}
			var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			//var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined) {
				continue;
			}

			block_idx = neoReference._block_idx;

			if(block_idx >= myBlocksList.blocksArray.length) {
				continue;
			}
			block = myBlocksList.getBlock(block_idx);

			/*
			if(magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding) {
				if(block != null)
				{

					if(block.isSmallObj)
								continue;

				}
			}
			*/

			// Check if the texture is loaded.********************************************************************************
			/*
			if(neoReference.texture != undefined && neoReference.texture.texId == undefined) {
				if(magoManager.backGround_fileReadings_count > 10) continue;

				// 1rst, check if the texture is loaded.***
				var texId = neoBuilding.getTextureId(neoReference.texture);
				if(texId == undefined) {
					// Load the texture.***
					var filePath_inServer = "/F4D_GeometryData/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.textureImageFileName;
					magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, neoReference.texture, neoBuilding, magoManager);
					magoManager.backGround_fileReadings_count ++;
					continue;
				} else {
					neoReference.texture.texId = texId;
				}
			}
			*/

			//if(neoReference.texture != undefined && renderTexture)


			//if(ssao_idx == -1) // selection render.***
//			{
			if(neoReference.selColor4) {
				gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.selColor4.r/255.0, neoReference.selColor4.g/255.0, neoReference.selColor4.b/255.0, neoReference.selColor4.a/255.0]);
			} else continue; // never enter here.***
//			}

			// End checking textures loaded.------------------------------------------------------------------------------------

			// ifc_space = 27, ifc_window = 26, ifc_plate = 14
			if(block != null) {

				cacheKeys_count = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
				// Must applicate the transformMatrix of the reference object.***
				gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);

				if(neoReference.moveVector != undefined) {
					gl.uniform1i(standardShader.hasAditionalMov_loc, true);
					gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***
				} else {
					gl.uniform1i(standardShader.hasAditionalMov_loc, false);
					gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
				}

				// for workers.**************************************************************************************************************************
				//vbo_ByteColorsCacheKeys_Container = neoBuilding._VBO_ByteColorsCacheKeysContainer_List[reference._VBO_ByteColorsCacheKeys_Container_idx];
				// End for workers.----------------------------------------------------------------------------------------------------------------------
				for(var n=0; n<cacheKeys_count; n++) // Original.***
				{
					//var mesh_array = block.viArraysContainer._meshArrays[n];
					this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];

					//****************************************************************************************************AAA
					if(this.vbo_vi_cacheKey_aux.meshVertexCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.posVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshVertexCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.posVboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.posVboDataArray.length = 0;
						continue;
					}
					/*
					if(this.vbo_vi_cacheKey_aux.meshNormalCacheKey == undefined)
					{
						if(this.vbo_vi_cacheKey_aux.norVboDataArray == undefined)
							continue;

						this.vbo_vi_cacheKey_aux.meshNormalCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshNormalCacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.norVboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.norVboDataArray.length = 0;
							continue;
					}
					*/
					if(this.vbo_vi_cacheKey_aux.meshFacesCacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.idxVboDataArray == undefined) continue;

						this.vbo_vi_cacheKey_aux.meshFacesCacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idxVboDataArray, gl.STATIC_DRAW);
						//this.vbo_vi_cacheKey_aux.indicesCount = this.vbo_vi_cacheKey_aux.idxVboDataArray.length;
						this.vbo_vi_cacheKey_aux.idxVboDataArray = null;
						continue;
					}

					//if(this.vbo_vi_cacheKey_aux.meshVertexCacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined || this.vbo_vi_cacheKey_aux.meshFacesCacheKey == undefined)
					//	continue;

					// Positions.***
					gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
					gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false,0,0);

					// Normals.***
					/*
					//if(ssao_idx != -1)
					{
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshNormalCacheKey);
						gl.vertexAttribPointer(standardShader.normal3_loc, 3, gl.BYTE, true,0,0);
					}
					*/

					// Indices.***
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
					gl.drawElements(gl.TRIANGLES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
					//gl.drawElements(gl.LINES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***

				}
			}

			timeControlCounter++;
			if(timeControlCounter > 20) timeControlCounter = 0;
		}
	}

	gl.enable(gl.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderLodBuilding = function(gl, lodBuilding, magoManager, shader, ssao_idx, isHighLighted) {
	if(lodBuilding.vbo_vicks_container.vboCacheKeysArray.length == 0) {
		return;
	}
	gl.frontFace(gl.CCW);
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	if(ssao_idx == 0) // depth.***
	{
		// 1) Position.*********************************************
		var vbo_vicky = lodBuilding.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		if(vbo_vicky.meshVertexCacheKey == null) {
			if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.posVboDataArray = undefined;

				//if(gl.getError() != gl.NO_ERROR) {
				//	alert('WebGL ERROR!!! *** XXXXXXXX***');
				//}
			}
			return;
		}

		var vertices_count = vbo_vicky.vertexCount;
		if(vertices_count == 0) {
			return;
		}



		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	} else if(ssao_idx == 1) // ssao.***
	{
		var vbo_vicky = lodBuilding.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		var vertices_count = vbo_vicky.vertexCount;

		if(vertices_count == 0) {
			return;
		}

		if(isHighLighted && isHighLighted == true)
		{
			var hola = 0;
		}

		// 1) Position.*********************************************
		if(vbo_vicky.meshVertexCacheKey == null) {
			if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.posVboDataArray = undefined;
			}
			return;
		}

		// 2) Normal.*********************************************
		if(vbo_vicky.meshNormalCacheKey == null) {
			if(vbo_vicky.norVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshNormalCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.norVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.norVboDataArray = undefined;
			}
			return;
		}

		// 3) Color.*********************************************
		if(vbo_vicky.meshColorCacheKey == null) {
			if(vbo_vicky.colVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshColorCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.colVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.colVboDataArray = undefined;
			}
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
		gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
		gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderLodBuildingColorSelection = function(gl, lodBuilding, magoManager, shader, ssao_idx, isHighLighted) {
	if(lodBuilding.vbo_vicks_container.vboCacheKeysArray.length == 0) {
		return;
	}
	gl.frontFace(gl.CCW);
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***


	// 1) Position.*********************************************
	var vbo_vicky = lodBuilding.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
	if(vbo_vicky.meshVertexCacheKey == null) {
		if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
		{
			vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

			vbo_vicky.posVboDataArray = undefined;

			//if(gl.getError() != gl.NO_ERROR) {
			//	alert('WebGL ERROR!!! *** XXXXXXXX***');
			//}
		}
		return;
	}

	var vertices_count = vbo_vicky.vertexCount;
	if(vertices_count == 0) {
		return;
	}



	gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
	gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);

};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderTriPolyhedron = function(gl, lodBuilding, magoManager, shader, ssao_idx, isHighLighted) {
	if(lodBuilding.vbo_vicks_container.vboCacheKeysArray.length == 0) {
		return;
	}
	gl.frontFace(gl.CCW);
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	if(ssao_idx == 0) // depth.***
	{
		// 1) Position.*********************************************
		var vbo_vicky = lodBuilding.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		if(vbo_vicky.meshVertexCacheKey == null) {
			if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.posVboDataArray = undefined;

				//if(gl.getError() != gl.NO_ERROR) {
				//	alert('WebGL ERROR!!! *** XXXXXXXX***');
				//}
			}
			return;
		}

		var vertices_count = vbo_vicky.vertexCount;
		if(vertices_count == 0) {
			return;
		}



		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	} else if(ssao_idx == 1) // ssao.***
	{
		var vbo_vicky = lodBuilding.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		var vertices_count = vbo_vicky.vertexCount;

		if(vertices_count == 0) {
			return;
		}

		if(isHighLighted && isHighLighted == true)
		{
			var hola = 0;
		}

		// 1) Position.*********************************************
		if(vbo_vicky.meshVertexCacheKey == null) {
			if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.posVboDataArray = undefined;
			}
			return;
		}

		// 2) Normal.*********************************************
		if(vbo_vicky.meshNormalCacheKey == null) {
			if(vbo_vicky.norVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshNormalCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.norVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.norVboDataArray = undefined;
			}
			return;
		}

		// 3) Color.*********************************************
		if(vbo_vicky.meshColorCacheKey == null) {
			if(vbo_vicky.colVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshColorCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.colVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.colVboDataArray = undefined;
			}
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
		gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);

		//gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
		//gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

		//gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		gl.drawArrays(gl.LINE_STRIP, 0, vertices_count);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderLego = function(gl, lego, magoManager, shader, ssao_idx) {
	if(lego.vbo_vicks_container.vboCacheKeysArray.length == 0) {
		return;
	}

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	if(ssao_idx == 0) // depth.***
	{
		// 1) Position.*********************************************
		var vbo_vicky = lego.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		if(vbo_vicky.meshVertexCacheKey == null) {
			if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.posVboDataArray = undefined;
			}
			return;
		}

		var vertices_count = vbo_vicky.vertexCount;
		if(vertices_count == 0) {
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	} else if(ssao_idx == 1) // ssao.***
	{
		var vbo_vicky = lego.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		var vertices_count = vbo_vicky.vertexCount;

		if(vertices_count == 0) {
			return;
		}

		// 1) Position.*********************************************
		if(vbo_vicky.meshVertexCacheKey == null) {
			if(vbo_vicky.posVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.posVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.posVboDataArray = undefined;
			}
			return;
		}

		// 2) Normal.*********************************************
		if(vbo_vicky.meshNormalCacheKey == null) {
			if(vbo_vicky.norVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshNormalCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.norVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.norVboDataArray = undefined;
			}
			return;
		}

		// 3) Color.*********************************************
		if(vbo_vicky.meshColorCacheKey == null) {
			if(vbo_vicky.colVboDataArray != undefined) //dataArrayByteLength > 0
			{
				vbo_vicky.meshColorCacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.colVboDataArray, gl.STATIC_DRAW);

				vbo_vicky.colVboDataArray = undefined;
			}
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
		gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
		gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param imageLod 변수
 * @param shader 변수
 */
Renderer.prototype.renderNeoSimpleBuildingPostFxShader = function(gl, neoBuilding, magoManager, imageLod, shader) {
	var simpBuild = neoBuilding.neoSimpleBuilding;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var shadersManager = magoManager.shadersManager;

	// check if has vbos.***
	if(simpBuild.vbo_vicks_container.vboCacheKeysArray.length == 0) {
		return;
	}

	if(imageLod == undefined) imageLod = 3; // The lowest lod.***

	//if(magoManager.isCameraMoving)
	//	imageLod = 3; // The lowest lod.***
	var shaderProgram = shader.program;

	gl.uniform3fv(shader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);

	//gl.activeTexture(gl.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***

	var skinTexture = simpBuild.texturesArray[0]; // provisionally take the 1rst.***

	gl.activeTexture(gl.TEXTURE2); // for diffuse texture.***
	if(imageLod == 3) gl.bindTexture(gl.TEXTURE_2D, skinTexture.textureId); // embedded image.***
	else if(imageLod == 0) gl.bindTexture(gl.TEXTURE_2D, skinTexture.textureId); // biggest image.***
	else if(imageLod == -1) {
		// dont bind texture.***
	}

	// now, check accesors.***
	var accesorsCount = simpBuild.accesorsArray.length;
	var stride = 0;
	for(var i=0; i<accesorsCount; i++) {
		var accesor = simpBuild.accesorsArray[i];

		var normalize_data = false;
		//var dataType = undefined;

		// Use accesor.data_ytpe. no use dataType.***
		if(accesor.data_ytpe == 5120) {
			//dataType = gl.BYTE;
			normalize_data = true;
		} else if(accesor.data_ytpe == 5121) {
			//dataType = gl.UNSIGNED_BYTE;
			normalize_data = true;
		} else if(accesor.data_ytpe == 5122) {
			//dataType = gl.SHORT;
			normalize_data = true;
		} else if(accesor.data_ytpe == 5123) {
			//dataType = gl.UNSIGNED_SHORT;
			normalize_data = true;
		} else if(accesor.data_ytpe == 5126) {
			//dataType = gl.FLOAT;
			normalize_data = false;
		}

		// 0= position, 1= normal, 2= color, 3= texcoord.***
		if(accesor.accesor_type == 0) // position.***
		{
			gl.enableVertexAttribArray(shader.position3_loc);
			//gl.vertexAttribPointer(shader.position3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			gl.vertexAttribPointer(shader.position3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start);
			stride = accesor.stride;
		} else if(accesor.accesor_type == 1) // normal.***
		{
			gl.enableVertexAttribArray(shader.normal3_loc);
			//gl.vertexAttribPointer(shader.normal3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			gl.vertexAttribPointer(shader.normal3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start);
		}
		else if(accesor.accesor_type == 3) // texcoord.***
		{
			if(imageLod != -1) {
				gl.enableVertexAttribArray(shader.texCoord2_loc);
				//gl.vertexAttribPointer(shader.texCoord2_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
				gl.vertexAttribPointer(shader.texCoord2_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start);
			}
		}
	}

	var vbo_vicky = simpBuild.vbo_vicks_container.vboCacheKeysArray[0];
	if(vbo_vicky.meshVertexCacheKey == null) {
		if(vbo_vicky.buffer.dataArray != undefined) //dataArrayByteLength > 0
		{
			vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.buffer.dataArray, gl.STATIC_DRAW);

			vbo_vicky.buffer.dataArray = undefined;
		}
	}

//	//for(var i=0; i<simpObjs_count; i++)
//	{
//		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
//		{
	var vertices_count = vbo_vicky.buffer.dataArrayByteLength / stride;
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
	//gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false,20,0);
	//if(imageLod != -1)gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.UNSIGNED_SHORT, true,20,12);
	//gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true,20,16);

	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
//		}
//	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param shader 변수
 */
Renderer.prototype.renderNeoSimpleBuildingDepthShader = function(gl, neoBuilding, magoManager, shader) {
	var simpBuild = neoBuilding.neoSimpleBuilding;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var shadersManager = magoManager.shadersManager;

	// check if has vbos.***
	if(simpBuild.vbo_vicks_container.vboCacheKeysArray.length == 0) {
		return;
	}

	var shaderProgram = shader.program;

	gl.uniform3fv(shader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);

	//gl.activeTexture(gl.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***

	//gl.activeTexture(gl.TEXTURE2); // for diffuse texture.***

	// now, check accesors.***
	var accesorsCount = simpBuild.accesorsArray.length;
	var stride = 0;
	for(var i=0; i<accesorsCount; i++) {
		var accesor = simpBuild.accesorsArray[i];

		var normalize_data = false;
		//var dataType = undefined;

		// Use accesor.data_ytpe. no use dataType.***
		if(accesor.data_ytpe == 5120) {
			//dataType = gl.BYTE;
			normalize_data = true;
		} else if(accesor.data_ytpe == 5121) {
			//dataType = gl.UNSIGNED_BYTE;
			normalize_data = true;
		} else if(accesor.data_ytpe == 5122) {
			//dataType = gl.SHORT;
			normalize_data = true;
		} else if(accesor.data_ytpe == 5123) {
			//dataType = gl.UNSIGNED_SHORT;
			normalize_data = true;
		} else if(accesor.data_ytpe == 5126) {
			//dataType = gl.FLOAT;
			normalize_data = false;
		}

		// 0= position, 1= normal, 2= color, 3= texcoord.***
		if(accesor.accesor_type == 0) // position.***
		{
			gl.enableVertexAttribArray(shader.position3_loc);
			//gl.vertexAttribPointer(shader.position3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			gl.vertexAttribPointer(shader.position3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start);
			stride = accesor.stride;
		}
	}

	var vbo_vicky = simpBuild.vbo_vicks_container.vboCacheKeysArray[0];
	if(vbo_vicky.meshVertexCacheKey == null) {
		if(vbo_vicky.buffer.dataArray != undefined) //dataArrayByteLength > 0
		{
			vbo_vicky.meshVertexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.buffer.dataArray, gl.STATIC_DRAW);

			vbo_vicky.buffer.dataArray = undefined;
		}
	}

//	//for(var i=0; i<simpObjs_count; i++)
//	{
//		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
//		{
	var vertices_count = vbo_vicky.buffer.dataArrayByteLength / stride;
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
//		}
//	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param BR_Project 변수
 * @param magoManager 변수
 * @param imageLod 변수
 * @param shader 변수
 */
Renderer.prototype.renderSimpleBuildingV1PostFxShader = function(gl, BR_Project, magoManager, imageLod, shader) {
	var simpBuildV1 = BR_Project._simpleBuilding_v1;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var shadersManager = magoManager.shadersManager;

	if(simpBuildV1._simpleObjects_array.length == 0) {
		return;
	}

	if(imageLod == undefined) imageLod = 3; // The lowest lod.***

	//if(magoManager.isCameraMoving)
	//	imageLod = 3; // The lowest lod.***
	var shaderProgram = shader.program;

	gl.uniform3fv(shader.buildingPosHIGH_loc, BR_Project.buildingPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, BR_Project.buildingPositionLOW);

	//gl.activeTexture(gl.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***


	gl.activeTexture(gl.TEXTURE2); // for diffuse texture.***
	if(imageLod == 3) gl.bindTexture(gl.TEXTURE_2D, simpBuildV1._simpleBuildingTexture); // embedded image.***
	else if(imageLod == 0) gl.bindTexture(gl.TEXTURE_2D, simpBuildV1._texture_0); // biggest image.***
	else if(imageLod == -1) {
		// dont bind texture.***
	}

	//gl.uniform1i(shaderProgram.samplerUniform, 0);

	// single interleaved buffer mode.************************************************************************************
	//for(var i=0; i<simpObjs_count; i++)
//	{

	this.simpObj_scratch = simpBuildV1._simpleObjects_array[0];

		//var vt_arraysCacheKeys_arrays_count = this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array.length;
		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
//		{
	var vertices_count = this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._vertices_count;
	gl.bindBuffer(gl.ARRAY_BUFFER, this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey);
	gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false,20,0);
	if(imageLod != -1)gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.UNSIGNED_SHORT, true,20,12);
	gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true,20,16);

	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
//		}
//	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param pCloudProject 변수
 * @param modelViewProjRelToEye_matrix 변수
 * @param encodedCamPosMC_High 변수
 * @param encodedCamPosMC_Low 변수
 * @param magoManager 변수
 */
Renderer.prototype.renderPCloudProject = function(gl, pCloudProject, modelViewProjRelToEye_matrix, encodedCamPosMC_High, encodedCamPosMC_Low, magoManager) {
	var shadersManager = magoManager.shadersManager;

	//if(simpBuildV1._simpleObjects_array.length == 0)
	//{
	//	return;
	//}

	// Test using f4d_shaderManager.************************
	var shader = shadersManager.getMagoShader(6);
	var shaderProgram = shader.SHADER_PROGRAM;

	gl.uniform1i(shaderProgram.samplerUniform, 0);

	gl.uniform3fv(shader._BuildingPosHIGH, pCloudProject._pCloudPositionHIGH);
	gl.uniform3fv(shader._BuildingPosLOW, pCloudProject._pCloudPositionLOW);

	// single interleaved buffer mode.************************************************************************************
	var vbo_datas_count = pCloudProject.vbo_datas.vboCacheKeysArray.length;
	for(var i=0; i<vbo_datas_count; i++) {
		var vbo_data = pCloudProject.vbo_datas.vboCacheKeysArray[i];

		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
//		{
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_data.meshVertexCacheKey);
		//gl.vertexAttribPointer(shader._position, 3, gl.FLOAT, false,19,0); // pos(4*3) + nor(1*3) + col(1*4) = 12+3+4 = 19.***
		gl.vertexAttribPointer(shader._position, 3, gl.FLOAT, false,28,0); // pos(4*3) + nor(4*3) + col(1*4) = 12+12+4 = 28.***
		gl.vertexAttribPointer(shader._color, 3, gl.UNSIGNED_BYTE, true,28,24);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_data.meshFacesCacheKey);
		gl.drawElements(gl.TRIANGLES, vbo_data.indicesCount, gl.UNSIGNED_SHORT, 0);

		//this.dateSC = new Date();
		//this.currentTimeSC = this.dateSC.getTime();
		//magoManager.renderingTime += this.currentTimeSC - this.startTimeSC;
//		}
	}
};
