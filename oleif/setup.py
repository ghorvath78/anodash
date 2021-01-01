import sys
import os
import numpy
from Cython.Distutils import build_ext
try:
    from setuptools import setup, find_packages
    from setuptools.extension import Extension
except ImportError:
    from distutils.core import setup
    from distutils.extension import Extension
prjdir = os.path.dirname(__file__)

extra_link_args = []
libraries = []
library_dirs = []
include_dirs = []
exec(open('version.py').read())
setup(
    name='oleif',
    version=__version__,
    author='Gabor Horvath, Matias Carrasco Kind, Sahand Hariri, Seng Keat Yeoh',
    author_email='ghorvath@hit.bme.hu',
    cmdclass={'build_ext': build_ext},
    ext_modules=[Extension("oleif",
                 sources=["_oleif.pyx", "oleif.cxx"],
                 include_dirs=[numpy.get_include()],
                 extra_compile_args=['-std=c++11', '-Wcpp'],
                 language="c++")],
    scripts=[],
    py_modules=['version'],
    packages=[],
    license='License.txt',
    include_package_data=True,
    description='On-line Extended Isolation Forest for anomaly detection',
    url='',
    install_requires=["numpy", "cython"],
)
