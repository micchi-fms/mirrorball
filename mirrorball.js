var downFrag=false;
function KeyDown(e){
	console.log(e.keyCode);
	if(e.keyCode==77&&downFrag==false){
		console.log("hai");
		document.getElementById("box").style.display="block";
		downFrag=true;
	}else if(e.keyCode==77&&downFrag==true){
		document.getElementById("box").style.display="none";
		downFrag=false;
	}
}
onload=function(){
	alert("円の大きさや色を変化させたい場合、「ｍ」キーを押してください。");
	var c=document.getElementById("canvas");
	c.width=window.innerWidth;
	c.height=window.innerHeight;

	var gl=c.getContext("webgl")||c.getContex("experimental-webgl");

	var eSingle=document.getElementById("single");
	var eRed=document.getElementById("red");
	var eGreen=document.getElementById("green");
	var eBlue=document.getElementById("blue");
	var eSize=document.getElementById("size");

	document.addEventListener("keydown" , KeyDown);

	var v_shader=create_shader("vs");
	var f_shader=create_shader("fs");
	var prg=create_program(v_shader,f_shader);

	var attLocation=new Array();
	attLocation[0]=gl.getAttribLocation(prg,'position');
	attLocation[1]=gl.getAttribLocation(prg,'color');

	var attStride=new Array();
	attStride[0]=3;
	attStride[1]=4;

	var circleData=Circle(64);
	var cPosition=create_vbo(circleData.p);
	var cColor=create_vbo(circleData.c);
	var cVBOList=[cPosition,cColor];
	var cIndex=create_ibo(circleData.i);
	set_attribute(cVBOList,attLocation,attStride);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,cIndex);

	var uniLocation=new Array();
	uniLocation[0]=gl.getUniformLocation(prg,'mvpMatrix');
	uniLocation[1]=gl.getUniformLocation(prg,'usesingle');
	uniLocation[2]=gl.getUniformLocation(prg,'redv');
	uniLocation[3]=gl.getUniformLocation(prg,'greenv');
	uniLocation[4]=gl.getUniformLocation(prg,'bluev');
	var m=new matIV();
	var mMatrix=m.identity(m.create());
	var vMatrix=m.identity(m.create());
	var pMatrix=m.identity(m.create());
	var tmpMatrix=m.identity(m.create());
	var mvpMatrix=m.identity(m.create());

	m.lookAt([0.0,0.0,5.0],[0,0,0],[0,1,0],vMatrix);
	m.perspective(45,c.width/c.height,0.1,100,pMatrix);
	m.multiply(pMatrix,vMatrix,tmpMatrix);

//	var count=0;

	(function(){
		gl.clearColor(0.0,0.0,0.0,1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

//		count++;

		var usesingle=eSingle.checked;
		var red_value=eRed.value/256;
		var green_value=eGreen.value/256;
		var blue_value=eBlue.value/256;
		var size_value=eSize.value/10;

		m.identity(mMatrix);
		m.scale(mMatrix,[size_value,size_value,0.0],mMatrix);
		m.multiply(tmpMatrix,mMatrix,mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[0],false,mvpMatrix);
		gl.uniform1i(uniLocation[1],usesingle);
		gl.uniform1f(uniLocation[2],red_value);
		gl.uniform1f(uniLocation[3],green_value);
		gl.uniform1f(uniLocation[4],blue_value);
		gl.drawElements(gl.TRIANGLES,circleData.i.length,gl.UNSIGNED_SHORT,0);

		gl.flush();

		setTimeout(arguments.callee,1000/30);
	})();
	//シェーダを生成する関数
	function create_shader(id){
		//シェーダを格納する変数
		var shader;

		//HTMLからscriptタグへの参照を所得
		var scriptElement=document.getElementById(id);
		//scriptタグが存在しない場合は抜ける
		if(!scriptElement){return;}

		//scriptタグのtype属性をチェック
		switch(scriptElement.type){
			//頂点シェーダの場合
			case 'x-shader/x-vertex':
				shader=gl.createShader(gl.VERTEX_SHADER);
				break;

			//フラグメントシェーダの場合
			case 'x-shader/x-fragment':
				shader=gl.createShader(gl.FRAGMENT_SHADER);
				break;

			default:
				return;
		}

		//生成されたシェーダーにソースを割り当てる
		gl.shaderSource(shader,scriptElement.text);

		//シェーダをコンパイルする
		gl.compileShader(shader);

		//シェーダが正しくコンパイルされたかチェック
		if(gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
			//成功していたらシェーダを返して終了
			return shader;
		}else{
			//失敗していたらエラーログをアラートする
			alert(gl.getShaderInfoLog(shader));
		}
	}

	//プログラムオブジェクトを生成しシェーダをリンクする関数
	function create_program(vs,fs){
		//プログラムオブジェクトの生成
		var program=gl.createProgram();
		//プログラムオブジェクトにシェーダを割り当てる
		gl.attachShader(program,vs);
		gl.attachShader(program,fs);

		//シェーダをリンク
		gl.linkProgram(program);

		//シェーダのリンクが正しく行われたかチェック
		if(gl.getProgramParameter(program,gl.LINK_STATUS)){
			//成功していたらプログラムオブジェクトを有効にする
			gl.useProgram(program);

			//プログラムオブジェクトを返して終了
			return program;
		}else{
			//失敗していたらエラーログをアラートする
			alert(gl.getProgramInfoLog(program));
		}
	}

	//VBOを生成する関数
	function create_vbo(data){
		//バッファオブジェクトの生成
		var vbo=gl.createBuffer();

		//バッファをバインドする
		gl.bindBuffer(gl.ARRAY_BUFFER,vbo);

		//バッファにデータをセットする
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);

		//バッファのバインドを無効化
		gl.bindBuffer(gl.ARRAY_BUFFER,null);

		return vbo;
	}

	//VBOをバインドし登録する関数
	function set_attribute(vbo,attL,attS){
		//引数として受け取った配列を処理する
		for(var i in vbo){
			//バッファをバインドする
			gl.bindBuffer(gl.ARRAY_BUFFER,vbo[i]);
			//attributeLocationを有効にする
			gl.enableVertexAttribArray(attL[i]);
			//attributeLocationを通知し登録する
			gl.vertexAttribPointer(attL[i],attS[i],gl.FLOAT,false,0,0);
		}
	}
	//IBOを生成する関数
	function create_ibo(data){
		//バッファオブジェクトの生成
		var ibo=gl.createBuffer();

		//バッファをバインドする
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);

		//バッファにデータをセット
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Int16Array(data),gl.STATIC_DRAW);

		//バッファのバインドを無効化
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);

		//生成したIBOを返して終了
		return ibo;
	}
	function Circle(row,color){
		var pos=new Array(), col=new Array(),idx=new Array();
		pos.push(0.0,0.0,0.0);
		for(var i=0;i<=row;i++){
			var r=2*Math.PI/row*i;
			var tx=Math.cos(r);
			var ty=Math.sin(r);
			if(color){
				var tc=color;
			}else{
				tc=hsva(360/row*i,1,1,1);
			}
			pos.push(tx,ty,0);
			col.push(tc[0],tc[1],tc[2],tc[3]);
		}

		for(i=0;i<row;i++){
			if(i+1<row){
				idx.push(0,i+1,i+2);
			}else{
				idx.push(0,i+1,1);
			}
		}
		return { p:pos , c:col ,i:idx };
	}
	function hsva(h, s, v, a){
		if(s > 1 || v > 1 || a > 1){return;}
		var th = h % 360;
		var i = Math.floor(th / 60);
		var f = th / 60 - i;
		var m = v * (1 - s);
		var n = v * (1 - s * f);
		var k = v * (1 - s * (1 - f));
		var color = new Array();
		if(!s > 0 && !s < 0){
			color.push(v, v, v, a); 
		} else {
			var r = new Array(v, n, m, m, k, v);
			var g = new Array(k, v, v, n, m, m);
			var b = new Array(m, m, k, v, v, n);
			color.push(r[i], g[i], b[i], a);
		}
		return color;
	}

}
