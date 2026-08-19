
$(function(){
	$('.moble').after('<button class="search-btn" type="button" aria-label="打开搜索"><i class="fa fa-search" aria-hidden="true"></i></button><div class="search-bg"></div>');
	$('.header .search-pup').clone(false).appendTo('.search-bg');
	$('.search-bg label[for="site-search"]').attr('for', 'mobile-site-search');
	$('.search-bg #site-search').attr('id', 'mobile-site-search');
	$('.sbtn').click(function(){
		$('.searchBox,.page-bg').fadeIn(0);
	});
	$('.search-btn').click(function(){
		$('.page-bg,.search-bg').fadeIn(0);
	});
	
	$('.s-weixin').click(function(){
		$('.page-bg').fadeIn(0);
		$('.weixin').addClass("open");
	});
	
	$('.page-bg').click(function(){
		$(this).fadeOut(300);
		$('.search-bg,.searchBox').fadeOut(300);
		$('.weixin').removeClass("open");
	});
	$('.moble-bars').after('<div class="mLogo"></div>');
	$('.header .logo').clone(false).appendTo('.mLogo');
	$('.moble-bars').after('<nav id="nav" class="inner"></nav>');
	$('.header .navbar').clone(false).attr('id', 'mobile-main-navigation').appendTo('#nav');
	$('.moble-bars').click(function(){
		var open = $(this).attr('aria-expanded') !== 'true';
		$(this).attr({
			'aria-expanded': open ? 'true' : 'false',
			'aria-label': open ? '关闭主导航' : '打开主导航'
		});
		$('body').toggleClass('nav-open', open);
		$('#nav').stop(true, true).slideToggle(300);
	});
	$('#navBox li').hover(function(){
       $(this).addClass('on');  
      },
	 function(){
       $(this).removeClass('on'); 
    });
	
	
	
/*	$('.post-img').hover(function(){
		var $msk = $(this).children('.msk');
		if(!$msk.is(':animated')){
			$msk.fadeIn(600);
		}
		$(this).find('img').css({'transform':'scale(1,1)'});
	},function(){
		$(this).find('.msk').fadeOut(600).end().find('img').css({'transform':'scale(1,1)'})
	});	
	*/
	
/*	$('.post-img').hover(function(){
		$(this).find('img').css({'transform':'scale(1.1,1.1)'});
	},
	
	function(){
		$(this).find('img').css({'transform':'scale(1,1)'})
	});	
	*/

	$('#slider').bxSlider({
		mode:'fade',
		auto:true,
		speed:500,
		pause:5000,
		slideMargin:0,
		adaptiveHeight: true,
		controls:true,
		autoHover: true,
		pager:true

     });
	
	$('.slider2').bxSlider({
		//slideWidth:1200, 
		infiniteLoop: true,
		hideControlOnEnd: true,
		auto:true,
		autoHover: true,
		slideMargin: 0
     });
	 
	 if (navigator.userAgent.indexOf('Mac OS X') !== -1) {
	  $('html').addClass('mac');
	} else {
	  $('html').addClass('wds');
	}
});




//返回顶部，隐藏导航
$(function() {
	    $(window).scroll(function(){		
		    if($(window).scrollTop()>500){		
			    $("#gttop").css({'visibility':'visible','opacity':1});
		    }else{
			    $("#gttop").css({'visibility':'hidden','opacity':0});
		    }
	    });		
	    $("#gttop").click(function(){
		    $("body,html").animate({scrollTop:0},1200);
		    return false;
	    });	
		$(window).resize(function(){
			var $width = $('body').width();
			if($width > 480){
				$('.fixed-search,.fixed-bg').hide();
			}
			if($width > 950){
				$('#nav').hide();
				$('.moble-bars').attr({'aria-expanded': 'false', 'aria-label': '打开主导航'});
				$('body').removeClass('nav-open');
			}			
		});	
});	
	
	
//导航跟随
(function(){
    var oDiv=document.getElementById("navBox");
    var H=0,iE6;
    var Y=oDiv;
    while(Y){H+=Y.offsetTop;Y=Y.offsetParent};
    iE6=window.ActiveXObject&&!window.XMLHttpRequest;
    if(!iE6){
        window.onscroll=function()
        {
            var s=document.body.scrollTop||document.documentElement.scrollTop;
            if(s>H){oDiv.className="header-nav menu fixed";if(iE6){oDiv.style.top=(s-H)+"px";}}
            else{oDiv.className="header-nav menu";}
        };
    }
})();
