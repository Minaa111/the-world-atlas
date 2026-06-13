import heroImage from '../assets/hero.jpg';

function Hero() {
    return (
        <section className="relative h-screen w-full flex flex-col justify-center items-center text-center px-6 overflow-hidden bg-background">

            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
                style={{ backgroundImage: `url(${heroImage})` }}
            ></div>

            <div className="relative z-10">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-text">
                    The Inequality Atlas
                </h1>

                <p className="max-w-xl text-gray-600 mb-6 text-text">
                    Explore Global Data Indicators Across The World
                </p>

                <a
                    href="#map"
                    className="bg-primary text-text px-6 py-3 rounded-[100px] hover:bg-secondary transition-all"
                >
                    Explore Map
                </a>
            </div>

        </section>
    );
}

export default Hero