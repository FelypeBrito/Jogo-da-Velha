sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Rounds the currency value to 2 digits
         *
         * @public
         * @param {string} sValue value to be formatted
         * @returns {string} formatted currency value with 2 digits
         */
        currencyValue : function (sValue) {
            if (!sValue) {
                return "";
            }

            return parseFloat(sValue).toFixed(2);
        },
        setVezImagem: function(sVez){
            switch(sVez) {
                case "X":
                    return '../img/X.jpg';
                case "O":
                 return '../img/O.jpg';

                 default:
                    return '../img/Branco.jpg';


            }


        }
    };
});