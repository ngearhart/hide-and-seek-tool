from PIL import Image as PILImage
from PIL import ImageDraw, ImageColor

from wand.image import Image
from wand.color import Color
from os import remove


COLORS = {
    "Transit Stations": "#5E3408",
    "Airports": "#FFFCF2",
    "Museums": "#0D3B66",
    "Movie Theaters": "#F4D666",
    "Hospitals": "#EB5E28",
    "Libraries": "#FAF0CA",
    "Zoos": "#A663CC",
    "Aquariums": "#669BBC",
    "Parks": "#84A98C",
    "Graveyards": "#03071E",
    "Custom Pins": "#C2095A",
}


def main():
    with open("location_on_25dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg", "r") as input_svg:
        data_outline = input_svg.read()
    with open("location_on_25dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg", "r") as input_svg:
        data_fill = input_svg.read()
    
    with Color('#00000000') as bgcolor, Image(blob=data_outline.encode(), format='svg', width=36, height=36, background=bgcolor) as img:
        with img.convert('png') as output_img:
            output_img.save(filename=f"tmp/outline-big.png")
    
    shadow = PILImage.open(f"tmp/outline-big.png")
    for color in COLORS:
        with Color('#00000000') as bgcolor, Image(blob=data_outline.replace("#e3e3e3", COLORS[color]).encode(), format='svg', width=32, height=32, background=bgcolor) as img:
            with img.convert('png') as output_img:
                output_img.save(filename=f"tmp/{color.replace(' ', '').lower()}-outline.png")
        with Color('#00000000') as bgcolor, Image(blob=data_fill.replace("#e3e3e3", COLORS[color]).encode(), format='svg', width=32, height=32, background=bgcolor) as img:
            with img.convert('png') as output_img:
                output_img.save(filename=f"tmp/{color.replace(' ', '').lower()}-fill.png")

        icon = PILImage.open(f"tmp/{color.replace(' ', '').lower()}-fill.png")
        outline = PILImage.open(f"tmp/{color.replace(' ', '').lower()}-outline.png")
        img = PILImage.alpha_composite(outline, icon)
        
        shadow.paste(img, (2, 2), img)
        # img = PILImage.alpha_composite(PILImage.alpha_composite(shadow, outline), icon)
        draw = ImageDraw.Draw(shadow)
        draw.circle((18, 18), 7, ImageColor.getrgb(COLORS[color]))

        overlay = PILImage.open(f"img/{color.replace(' ', '').lower()}.png")
        shadow.paste(overlay, (8, 6), overlay)
        shadow.save(f"tmp/{color.replace(' ', '').lower()}.png")

        remove(f"tmp/{color.replace(' ', '').lower()}-outline.png")
        remove(f"tmp/{color.replace(' ', '').lower()}-fill.png")


    # bg_icon = svg2rlg("location_on_25dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg")


if __name__ == "__main__":
    main()
